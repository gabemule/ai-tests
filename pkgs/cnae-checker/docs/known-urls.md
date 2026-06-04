# Known URLs — IBGE Download Inventory

> Last updated: 2026-03-06
> These URLs are tracked in `scripts/scrape-urls.js` → `KNOWN_URLS` array.
> When `npm run scrape` reports a URL as "🆕 NEW", it means IBGE added something that wasn't here before.

## How This Works

The `scrape-urls.js` script fetches the IBGE download page and compares every `.xls`/`.xlsx` link against the `KNOWN_URLS` list below. If all links are known, everything is green. If a new link appears, it exits with code 1 (used by CI/CD to trigger alerts).

**When you see a new URL:**
1. Check what it is (new CNAE version? new PRODLIST year?)
2. Add it to `KNOWN_URLS` in `scripts/scrape-urls.js`
3. Add it to this document
4. If it's a new CNAE version, also add to `FILES` in `scripts/download.js`

---

## CNAE Files (What We Care About)

### CNAE 2.0 Classes ⭐ Primary

The current class-level structure (673 classes). **Actively downloaded and parsed.**

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE20_EstruturaDetalhada.xls` | Structure | `.xls` | `/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls` |
| `CNAE20_Correspondencias.xls` | Correspondences | `.xls` | `/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Correspondencias.xls` |

### CNAE 2.3 Subclasses ⭐ Latest

The most recent subclass-level structure (~1300 subclasses). **Actively downloaded.**

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx` | Structure | `.xlsx` | `/images/concla/documentacao/CNAE_Subclasses_2_3_Estrutura_Detalhada.xlsx` |
| `CNAE_Subclasses_2_3_Tabelas_de_correspondência.xlsx` | Correspondences | `.xlsx` | `/images/concla/documentacao/CNAE_Subclasses_2_3_Tabelas_de_correspondência.xlsx` |

### CNAE 2.2 Subclasses

Previous subclass version. Historical reference.

| File | Type | Format | URL |
|------|------|--------|-----|
| `Subclasses CNAE 2.2 - Estrutura.xls` | Structure | `.xls` | `/images/concla/downloads/Subclasses CNAE 2.2 - Estrutura.xls` |
| `corresp-cnae-sub-2-2x2-1--2-1x2-2-preferenciais.xls` | Correspondences | `.xls` | `/images/concla/downloads/corresp-cnae-sub-2-2x2-1--2-1x2-2-preferenciais.xls` |

### CNAE 2.1 Subclasses

Older subclass version.

| File | Type | Format | URL |
|------|------|--------|-----|
| `cnae21_estrutura_detalhada.xls` | Structure | `.xls` | `/images/concla/downloads/revisao2007/prop_cnae21/cnae21_estrutura_detalhada.xls` |
| `cnae21_correspondencias.xls` | Correspondences | `.xls` | `/images/concla/downloads/revisao2007/prop_cnae21/cnae21_correspondencias.xls` |

### CNAE 2.0 Subclasses

First subclass version under CNAE 2.0.

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE20_Subclasses_EstruturaDetalhada.xls` | Structure | `.xls` | `/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_EstruturaDetalhada.xls` |
| `CNAE20_Subclasses_Correspondencias.xls` | Correspondences | `.xls` | `/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_Subclasses_Correspondencias.xls` |

### CNAE 1.0

Legacy. First major revision (2002).

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE1.0.xls` | Structure | `.xls` | `/images/concla/downloads/CNAE1.0.xls` |

### CNAE-Fiscal 1.1

Tax-oriented subclass version. Legacy.

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE-Fiscal 1.1.xls` | Structure | `.xls` | `/images/concla/downloads/CNAE-Fiscal 1.1.xls` |

### CNAE (Original)

The very first CNAE (1994). Historical only.

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE.xls` | Structure | `.xls` | `/images/concla/downloads/CNAE.xls` |

### CNAE-Domiciliar

Simplified version used for household surveys (PNAD etc).

| File | Type | Format | URL |
|------|------|--------|-----|
| `CNAE_Domiciliar 2.0 (ABR 2010) - Estrutura.xlsx` | Structure 2.0 | `.xlsx` | `/np_download/concla/CNAE_Domiciliar 2.0 (ABR 2010) - Estrutura.xlsx` |
| `cnae_dom_codigos.xls` | Structure (original) | `.xls` | `/images/concla/downloads/cnae_dom_codigos.xls` |

---

## Non-CNAE Files (Tracked to Avoid False Positives)

These files are on the same download page but are **not CNAE**. We track them so they don't show up as "new" in our scrape.

### PRODLIST-Indústria

Industrial product classification. Updated periodically.

| File | Year | Type | URL |
|------|------|------|-----|
| `Prodlist-Industria 2025.xlsx` | 2025 | Structure | `/images/concla/downloads/Prodlist-Industria 2025.xlsx` |
| `3correspondenciaProdlist-indústria 2025.xlsx` | 2025 | Correspondences | `/images/concla/downloads/3correspondenciaProdlist-indústria 2025.xlsx` |
| `Prodlist_Industria_2022.xlsx` | 2022 | Structure | `/images/concla/downloads/Prodlist_Industria_2022.xlsx` |
| `prodlist_industria_2022 x 2019_DE PARA.xlsx` | 2022→2019 | Correspondences | `/images/concla/downloads/prodlist_industria_2022 x 2019_DE PARA.xlsx` |
| `Prodlist_Industria_2019.xlsx` | 2019 | Structure | `/images/concla/downloads/Prodlist_Industria_2019.xlsx` |
| `prodlist_industria_2019 x 2016_DE PARA.xlsx` | 2019→2016 | Correspondences | `/images/concla/downloads/prodlist_industria_2019 x 2016_DE PARA.xlsx` |
| `PRODLIST-Industria-2016.xls` | 2016 | Structure | `/images/concla/downloads/PRODLIST-Industria-2016.xls` |
| `PROD2016X2013.xls` | 2016→2013 | Correspondences | `/images/concla/downloads/PROD2016X2013.xls` |
| `PRODLIST- Indústria 2013.xls` | 2013 | Structure | `/images/concla/downloads/PRODLIST- Indústria 2013.xls` |
| `PROD2013X2010.xls` | 2013→2010 | Correspondences | `/images/concla/downloads/PROD2013X2010.xls` |
| `PRODLISTIndustria2010.xls` | 2010 | Structure | `/images/concla/downloads/PRODLISTIndustria2010.xls` |
| `PROD2010x2007.xls` | 2010→2007 | Correspondences | `/images/concla/downloads/PROD2010x2007.xls` |
| `PRODLISTIndustria2007.xls` | 2007 | Structure | `/images/concla/downloads/PRODLISTIndustria2007.xls` |
| `PROD2007x2006.xls` | 2007→2006 | Correspondences | `/images/concla/downloads/PROD2007x2006.xls` |
| `PRODLISTIndustria2006.xls` | 2006 | Structure | `/images/concla/downloads/PRODLISTIndustria2006.xls` |
| `PROD2006x2005.xls` | 2006→2005 | Correspondences | `/images/concla/downloads/PROD2006x2005.xls` |
| `PRODLISIndustria2005.xls` | 2005 | Structure | `/images/concla/downloads/PRODLISIndustria2005.xls` |
| `PROD2005x2004.xls` | 2005→2004 | Correspondences | `/images/concla/downloads/PROD2005x2004.xls` |

### PRODLIST-Agro/Pesca

Agricultural and fishing product classification.

| File | Year | URL |
|------|------|-----|
| `EstruturaProdlistAgroPesca2003.xls` | 2003 | `/images/concla/downloads/EstruturaProdlistAgroPesca2003.xls` |
| `EstruturaProdlistAgroPesca2007.xls` | 2007 | `/images/concla/downloads/EstruturaProdlistAgroPesca2007.xls` |
| `EstruturaProdlistAgroPesca2008.xls` | 2008 | `/images/concla/downloads/EstruturaProdlistAgroPesca2008.xls` |
| `EstruturaProdlistAgroPesca2013.xls` | 2013 | `/images/concla/downloads/EstruturaProdlistAgroPesca2013.xls` |
| `EstruturaProdlistAgroPesca2018.xls` | 2018 | `/images/concla/downloads/EstruturaProdlistAgroPesca2018.xls` |
| `EstruturaProdlistAgroPesca2021.xlsx` | 2021 | `/images/concla/estrutura/EstruturaProdlistAgroPesca2021.xlsx` |

### Other

| File | Description | URL |
|------|-------------|-----|
| `IPCAxCOICOP.xls` | IPCA/INPC product correspondence to COICOP | `/images/concla/downloads/IPCAxCOICOP.xls` |

---

## Files NOT Tracked (ZIP/PDF/DOC)

The scrape only looks for `.xls` and `.xlsx` files. These formats exist on the page but are **not tracked**:

- `.zip` — Older archives (CNAE-Fiscal 1.0, CNAE 1.0 correspondences, etc.)
- `.pdf` — Notas Explicativas (descriptive documents, not data)
- `.doc` — Natureza Jurídica tables (different classification, not CNAE)

These are intentionally excluded. If you need them, add ZIP support to `download.js`.

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| CNAE files (all versions) | 15 | ⭐ Core — actively monitored |
| PRODLIST-Indústria | 18 | 📦 Tracked to avoid false positives |
| PRODLIST-Agro/Pesca | 6 | 📦 Tracked to avoid false positives |
| Other | 1 | 📦 Tracked to avoid false positives |
| **Total tracked** | **40** | |

**Base URL:** `https://cnae.ibge.gov.br`
