# IBGE Data Sources — Download URLs & Formats

> Last scraped: 2026-03-06
> Source: https://cnae.ibge.gov.br/classificacoes/download-concla.html

## Overview

The IBGE CONCLA website provides all CNAE data as downloadable files. There is **no API** — only static file downloads served from a standard HTML page.

**Key facts:**
- No authentication required
- No rate limiting observed
- HTML is static (no JavaScript-rendered content)
- URLs follow predictable patterns
- Files are served directly (no redirects)

## CNAE Files — Complete Inventory

### ⭐ Primary Files (What We Need)

#### CNAE 2.0 Classes (Current for Class-level)

| Type | Format | URL |
|------|--------|-----|
| Estrutura Detalhada | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls` |
| Notas Explicativas | `.pdf` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_NotasExplicativas.pdf` |
| Correspondências | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Correspondencias.xls` |

#### CNAE 2.3 Subclasses (Latest — Most Granular)

| Type | Format | URL |
|------|--------|-----|
| Estrutura Detalhada | `.xlsx` | `https://cnae.ibge.gov.br/images/concla/documentacao/CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx` |
| Correspondências | `.xlsx` | `https://cnae.ibge.gov.br/images/concla/documentacao/CNAE_Subclasses_2_3_Tabelas_de_correspondência.xlsx` |

### 📦 Secondary Files (Historical / Reference)

#### CNAE 2.2 Subclasses

| Type | Format | URL |
|------|--------|-----|
| Estrutura | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/Subclasses CNAE 2.2 - Estrutura.xls` |
| Notas Explicativas | `.pdf` | `https://cnae.ibge.gov.br/images/concla/downloads/cnae-subclasses-2-2-notas-explicativas.pdf` |
| Correspondências | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/corresp-cnae-sub-2-2x2-1--2-1x2-2-preferenciais.xls` |

#### CNAE 2.1 Subclasses

| Type | Format | URL |
|------|--------|-----|
| Estrutura | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/prop_cnae21/cnae21_estrutura_detalhada.xls` |
| Notas Explicativas | `.pdf` | `https://cnae.ibge.gov.br/images/concla/downloads/cnae21_notas_explicativas.pdf` |
| Correspondências | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/prop_cnae21/cnae21_correspondencias.xls` |

#### CNAE 2.0 Subclasses

| Type | Format | URL |
|------|--------|-----|
| Estrutura | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_EstruturaDetalhada.xls` |
| Notas Explicativas | `.pdf` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_NotasExplicativas.pdf` |
| Correspondências | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_Correspondencias.xls` |

#### CNAE 1.0

| Type | Format | URL |
|------|--------|-----|
| Estrutura | `.xls` | `https://cnae.ibge.gov.br/images/concla/downloads/CNAE1.0.xls` |
| Correspondências | `.zip` | `https://cnae.ibge.gov.br/images/concla/downloads/cnae1_0.zip` |

#### CNAE-Domiciliar 2.0

| Type | Format | URL |
|------|--------|-----|
| Estrutura | `.xlsx` | `https://cnae.ibge.gov.br/np_download/concla/CNAE_Domiciliar 2.0 (ABR 2010) - Estrutura.xlsx` |

## File Format Support

| Format | Extension | Parser | Status |
|--------|-----------|--------|--------|
| Excel 97-2003 | `.xls` | `xlsx` lib | ✅ Supported |
| Excel 2007+ | `.xlsx` | `xlsx` lib | ✅ Supported |
| ZIP archives | `.zip` | `adm-zip` or `unzipper` | ❌ Not yet supported |
| PDF | `.pdf` | N/A | ❌ Not needed (notas explicativas only) |

## URL Patterns

Files are served from two main paths:

```
https://cnae.ibge.gov.br/images/concla/downloads/...    # Older files
https://cnae.ibge.gov.br/images/concla/documentacao/...  # Newer files (2.3)
https://cnae.ibge.gov.br/np_download/concla/...          # Domiciliar
```

## Scraping the Download Page

The download page at `https://cnae.ibge.gov.br/classificacoes/download-concla.html` contains a single HTML table with all download links. To discover new files:

1. Fetch the HTML page (`curl` or `axios`)
2. Parse links matching patterns:
   - `href` containing `.xls` or `.xlsx`
   - `href` containing `CNAE` or `cnae`
3. Extract the file classification name from the table row

### Scraping Checklist (When Checking for Updates)

- [ ] Fetch the download page HTML
- [ ] Extract all download links (`.xls`, `.xlsx`, `.zip`)
- [ ] Compare against known URL list (see above)
- [ ] Check for new CNAE versions (e.g., CNAE 2.4, CNAE 3.0)
- [ ] Verify existing URLs still work (HTTP 200)
- [ ] Download new/changed files
- [ ] Compare file hashes (MD5/SHA256) to detect content changes
- [ ] Parse and validate new data
- [ ] Update this document with new findings

### Known Issues

- **URL encoding:** Some URLs contain spaces (e.g., `Subclasses CNAE 2.2 - Estrutura.xls`). Must be URL-encoded for programmatic access.
- **Mixed formats:** Older files are `.xls`, newer are `.xlsx`. The `xlsx` library handles both.
- **No versioning metadata:** Files don't have version numbers or dates in their metadata. Must track changes via file hash.

## Update Frequency

CNAE changes **very rarely**. Major revisions:
- 2007: CNAE 2.0 (current for Classes)
- 2013: CNAE 2.1 Subclasses
- 2018: CNAE 2.2 Subclasses
- 2024+: CNAE 2.3 Subclasses

**Recommendation:** Check monthly. A quarterly check would also be sufficient.
