# Directive: Fetch Technical Fiscal News (ACBR & Reddit)

## Goal
Fetch updates exclusively related to technical fiscal changes (Notas Técnicas, Mudanças de Layout, Rejeições SEFAZ, NF-e, NFC-e, NFS-e, CT-e, etc.) in Brazil. Do NOT include general tax complaints or generic news; the focus is technical and developmental. Include the ACBR portal as a primary source.

## Inputs
- **ACBR Source**: `https://projetoacbr.com.br/forum/forum/15-not%C3%ADcias/` or `https://projetoacbr.com.br/forum/discover/`
- **Reddit Source**: `r/brasil`, `r/brdev`, `r/ContabilidadeAtual`
- **Keywords Filter**: `NF-e`, `NFC-e`, `NFS-e`, `Sefaz`, `novos layouts`, `nota técnica`, `layout`, `emissão`, `rejeição`, `schema`, `mudança`

## Tools/Scripts to Use
- `execution/get_technical_news.ps1`

## Outputs
- Data saved to `.tmp/technical_fiscal_raw.json`
- Summarized top technical posts saved to `.tmp/technical_fiscal_news.md`

## Edge Cases
- If ACBR blocks bots via User-Agent, simulate a standard Windows Chrome User-Agent.
- Since ACBR doesn't have a reliable RSS, use HTML Regex parsing to extract titles `<a href=... title="...">` from the subforum.
