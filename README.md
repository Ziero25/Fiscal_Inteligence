# 📊 Fiscal Intelligence Portal

> Uma plataforma avançada para agregação, análise e visualização de dados fiscais técnicos (NF-e, Sefaz) e discussões da comunidade.

---

## 🌟 Arquitetura e Funcionamento do Sistema

O **Fiscal Intelligence Portal** opera em um modelo de duas camadas principais (Coleta/Enriquecimento e Interface/Consumo), desenhado para oferecer insights acionáveis com alta velocidade.

### 1. Motor de Coleta e Enriquecimento Automático (Python)
O coração dos dados vive em `execution/fetch_all.py`, um sistema desenhado para ser resiliente e eficiente:
- **Processamento Paralelo (ThreadPoolExecutor):** Varre simultaneamente canais governamentais (Portal Nacional da NF-e) e fóruns de especialistas (Reddit - r/ContabilidadeAtual e r/brdev).
- **Deep Text Extraction (Extração Profunda):** A coleta governamental não pega apenas o título. O script penetra na estrutura DOM da Sefaz para extrair `NavigableStrings` (elementos de texto soltos após links de Notas Técnicas), assegurando que resumos técnicos de layout, regras de validação ou ajustes de schema cheguem integralmente na nossa base.
- **Taxonomia Inteligente e Fallbacks:** O sistema processa palavras-chave (ex: "agro", "reforma", "schema", "rejeição") e constrói dinamicamente campos de *Urgência* e *Importância para Emissores*.
- **Parsing de PDFs:** Identifica links `.aspx` e `.pdf` da Sefaz, embutindo placeholders dinâmicos (`[DOWNLOAD PDF]`) junto às notas para que a UI os transforme em links diretos, poupando tempo de navegação no site do governo.

### 2. Interface Premium e Consumo de Dados (Frontend Vanilla)
A estrutura em `app/` (HTML, JS, CSS) consome o `data2.json` estático mitigando a necessidade de banco de dados ativo.
- **Dashboard com Filtros Cross-Source:** Busca unificada local. A barra de busca no frontend filtra simultaneamente tópicos da comunidade e Notas Técnicas pelo título, snippet ou conteúdo profundo.
- **Renderização Dinâmica (`topic.js`):** Quando um detalhe de nota é aberto, o script intercepta links da Sefaz marcados textualmente e os converte nativamente em **Botões de Download**, abrindo caminho rápido ao PDF original, mantendo a documentação e os alertas visuais renderizados em formato Markdown-like.
- **Micro-interações Glassmorphic:** Design profissional sem excesso de frameworks (Vanilla CSS), carregamento otimizado com transições de página (`index.html` → `dashboard.html`).

---

## 🚀 Como Iniciar e Operar

### 1. Clonando e Executando a Interface Web
```bash
git clone https://github.com/Ziero25/Fiscal_Inteligence.git
cd Fiscal_Inteligence
```
Para ver o portal, apenas abra `app/index.html` em qualquer navegador moderno. Como o banco de dados viaja junto ao repositório como um JSON estático (`data2.json`), não há setup de dependência para visualização.

### 2. Atualizando o Banco de Dados (Web Scraping)
Caso necessite sincronizar as notas mais recentes:
1. Certifique-se de ter Python 3.12+ instalado.
2. Instale os requerimentos: `pip install requests beautifulsoup4 lxml`
3. Force a atualização para ignorar o cache local (2 horas):
   ```bash
   python execution/fetch_all.py --force
   ```
O log de console demonstrará o processamento assíncrono das três threads (Sefaz, Contabilidade, Fiscal devs) processandos os novos itens e atualizando `app/data2.json`.

---

## 📂 Estrutura do Projeto

```text
/
├── app/                  # Interface Front-end Vanilla
│   ├── index.html        # Landing Page (Início)
│   ├── dashboard.html    # Aplicativo de Busca/Radar
│   ├── topic.html        # Página de Leitura Profunda da Nota/Texto
│   ├── main.js           # Lógica do painel inteligente
│   ├── topic.js          # Conversão de Texto e Render PDF do BD
│   ├── style.css         # Design System Glassmorphic
│   └── data2.json        # "Banco de Dados" atualizado em tempo real pelo script Python
├── execution/            # Core de Extração de Dados
│   └── fetch_all.py      # Master Scraper (Sefaz & Comunidades)
├── directives/           # Manuais (SOPs) Operacionais
├── .gitignore            # Ignorando node_modules e metadados lixo
└── README.md             # Esta documentação
```

---

## 💡 Contribuição

Contribuições na engine Python para novas abordagens de parse (como PyPDF2 para ler por dentro do PDF de Notas Técnicas) são bem-vindas via Pull Request.

Desenvolvido com ❤️ por [Ziero25](https://github.com/Ziero25).
