# -*- coding: utf-8 -*-
"""
get_gov_news.py
Fetches real gov fiscal news from accessible BR government sources and
enriches note titles with contextual descriptions.
Outputs JSON to stdout for consumption by the main PowerShell pipeline.
"""

import sys, json, uuid, datetime, re, requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "pt-BR,pt;q=0.9",
}
TIMEOUT = 5
results = []


def clean_text(raw):
    if not raw:
        return ""
    soup = BeautifulSoup(raw, "lxml")
    return re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()


def truncate(text, n):
    return text[:n] + "..." if len(text) > n else text


def enrich_gov_title(title):
    """Generate a rich contextual description based on the note title keywords."""
    t = title.lower()
    extra = ""

    if "agro" in t:
        extra = "Esta nota trata de ajustes fiscais para o setor agropecuario (Nota Fiscal do Produtor Rural e MDF-e agricola)."
    elif "reforma tributaria" in t or "reforma" in t:
        extra = "Nota relacionada as adequacoes do leiaute da NF-e as novas regras da Reforma Tributaria do Consumo (IBS/CBS)."
    elif "pagamento" in t:
        extra = "Atualizacao da tabela de meios de pagamento aceitos no campo tPag do leiaute da NF-e/NFC-e. Desenvolvedores devem sincronizar o sistema com os novos codigos aceitos."
    elif "svc" in t:
        extra = "Ajustes de operacao referentes ao Servico de Contingencia (SVC-AN/SVC-RS) da infraestrutura NF-e. Afeta a emissao de notas quando o servico principal esta instavel."
    elif "schema" in t or "xsd" in t:
        extra = "Publicacao de novos schemas XSD. Emissores de NF-e devem adotar o novo schema antes da data de vigencia para evitar rejeicoes."
    elif "rejeicao" in t or "rejeição" in t:
        extra = "Documentacao de novos codigos ou regras de rejeicao inseridos nas validacoes das SEFAZ Autorizadoras. Verifique se seu sistema ja trata os novos codigos."
    elif "classtrib" in t or "classtrib" in title:
        extra = "Tabelas de classificacao tributaria (cClassTrib) atualizadas — essenciais para o correto preenchimento dos campos de tributacao nos XMLs de NF-e."
    elif "tabela" in t:
        extra = "Tabela auxiliar de dominio atualizada. O sistema emissor precisa sincronizar os valores dos campos com os novos codigos aceitos."
    elif "informe tecnico" in t or "informe" in t:
        extra = "Informe tecnico com orientacoes operacionais para os sistemas emissores de NF-e. Verifique a data de vigencia e atualize antes do prazo."
    elif "nota tecnica" in t:
        extra = "Documento tecnico com alteracoes de regras de negocio, validacoes ou leiautes para o ambiente NF-e/NFC-e. Desenvolvedores fiscais devem avaliar o impacto antes da vigencia."
    else:
        extra = "Publicacao oficial referente a mudancas no ecossistema da Nota Fiscal Eletronica. Acesse o link para o documento completo."

    match_ref = re.search(r"(\d{4}\.\d{3})", title)
    ref = f" {match_ref.group(1)}" if match_ref else ""
    match_ver = re.search(r"v\.([\d.]+)", title, re.I)
    ver = f" versao {match_ver.group(1)}" if match_ver else ""

    if "nota tecnica" in t:
        intro = f"Publicacao oficial da Secretaria da Fazenda (SEFAZ) referente a Nota Tecnica{ref}{ver}."
    elif "informe" in t:
        intro = f"Informe Tecnico oficial{ref}{ver} publicado pelo Portal Nacional da NF-e."
    else:
        intro = f"Atualizacao oficial do Portal Nacional da NF-e."

    desc = f"{intro} {extra}"
    return desc, desc


# ── SOURCE 1: Portal NF-e (Informes + Notas Tecnicas) ──────────────────────
try:
    r = requests.get(
        "https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=tW+YMyk/50s=",
        headers=HEADERS, timeout=TIMEOUT
    )
    soup = BeautifulSoup(r.text, "lxml")
    pattern = re.compile(r"Nota\s+T[eé]cnica|Informe|NT\s*\d|Publicad|Agendamento|Consulta|Central|Perguntas", re.I)
    links = soup.find_all("a", string=pattern)
    seen = set()
    for a in links[:10]:
        title = a.get_text(strip=True)
        href = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.nfe.fazenda.gov.br/portal/" + href.lstrip("/")
        if href in seen or not title or len(title) < 5:
            continue
        seen.add(href)
        snippet, fulltext = enrich_gov_title(title)
        results.append({
            "Id": str(uuid.uuid4()),
            "Source": "Portal Nacional da NF-e (Oficial)",
            "Title": title,
            "Url": href,
            "Date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "Snippet": snippet,
            "FullText": fulltext,
            "Category": "Fiscal",
            "Type": "News and Announcements",
        })
except Exception as e:
    sys.stderr.write(f"[WARN] Portal NF-e scrape failed: {e}\n")

# ── SOURCE 2: GOV.BR Receita Federal – Noticias ────────────────────────────
try:
    r = requests.get(
        "https://www.gov.br/receitafederal/pt-br/assuntos/noticias",
        headers=HEADERS, timeout=TIMEOUT
    )
    soup = BeautifulSoup(r.text, "lxml")
    articles = soup.select("article.tileItem, article, .summary")[:8]
    fiscal_terms = ["nf-e", "nota fiscal", "sefaz", "sped", "tributo", "irpf", "simples", "mei", "imposto"]
    for art in articles:
        a = art.find("a")
        if not a:
            continue
        title = a.get_text(strip=True)
        href = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.gov.br" + href
        desc_tag = art.find(class_=re.compile(r"description|summary|lead|intro"))
        desc = clean_text(desc_tag.get_text()) if desc_tag else ""
        if not title or len(title) < 10:
            continue
        if not any(t in title.lower() or t in desc.lower() for t in fiscal_terms):
            continue
        results.append({
            "Id": str(uuid.uuid4()),
            "Source": "GOV.BR / Receita Federal",
            "Title": title,
            "Url": href,
            "Date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "Snippet": truncate(desc, 500) if desc else "Noticia da Receita Federal publicada no portal GOV.BR sobre obrigacoes fiscais e tributarias.",
            "FullText": desc or "Acesse o link para ler a noticia completa no portal GOV.BR da Receita Federal.",
            "Category": "Fiscal",
            "Type": "News and Announcements",
        })
except Exception as e:
    sys.stderr.write(f"[WARN] GOV.BR scrape failed: {e}\n")

if not results:
    sys.stderr.write("[WARN] No government results found.\n")

print(json.dumps(results, ensure_ascii=False, indent=2))
