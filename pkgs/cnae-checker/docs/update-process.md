# Update Process — How to Keep CNAE Data Current

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐
│  Download    │ ──▶ │   Extract   │ ──▶ │   Check     │ ──▶ │  Done!   │
│  from IBGE   │     │  XLS → JSON │     │  Validate   │     │          │
└─────────────┘     └─────────────┘     └─────────────┘     └──────────┘
```

## Manual Update (Current)

### Step 1: Download the latest file

Download `CNAE20_EstruturaDetalhada.xls` from IBGE:

```bash
curl -o CNAE20_EstruturaDetalhada.xls \
  "https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls"
```

### Step 2: Extract to JSON

```bash
npm run extract
```

This reads the XLS file and generates `cnae.json` with 673 structured entries.

### Step 3: Validate

```bash
npm run check
```

Expected output:
```
=== EXTRACTION CHECK ===

{ secoes: 21, divisoes: 87, grupos: 285, classes: 673, total: 673 }

=== DUPLICADOS ===
Qtd duplicados: 0

=== CÓDIGOS INVÁLIDOS ===
Qtd inválidos: 0

=== STATUS ===
✅ EXTRAÇÃO CNAE VÁLIDA
```

### If validation fails:

1. **Wrong counts** — Check if IBGE updated the file structure (new rows/columns?)
2. **Duplicates** — Check if extract.js deduplication logic needs updating
3. **Invalid codes** — Check if code format changed (regex in check-extraction.js)
4. **Missing data** — Check if column order changed in the XLS file

## Automated Update (Future)

### Using npm scripts

```bash
# Full update pipeline
npm run update

# Individual steps
npm run download    # Download files from IBGE
npm run extract     # Parse XLS → JSON
npm run check       # Validate extraction
```

### Flow

```javascript
// update.js (future)
async function update() {
  // 1. Download latest files
  await download();
  
  // 2. Check if files changed (hash comparison)
  const changed = await checkHash();
  if (!changed) {
    console.log('No changes detected. Skipping.');
    return;
  }
  
  // 3. Extract data
  await extract();
  
  // 4. Validate
  const valid = await check();
  if (!valid) {
    console.error('Validation failed!');
    process.exit(1);
  }
  
  console.log('✅ Update complete!');
}
```

### GitHub Actions (Future Automation)

```yaml
name: Update CNAE Data
on:
  schedule:
    - cron: '0 3 1 * *'  # Monthly, 1st day at 3am UTC
  workflow_dispatch: {}    # Manual trigger
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm install
      - run: npm run update
      - name: Commit if changed
        run: |
          git diff --quiet cnae.json || (
            git config user.name "github-actions"
            git config user.email "actions@github.com"
            git add cnae.json
            git commit -m "chore: update CNAE data $(date +%Y-%m-%d)"
            git push
          )
```

## Adding a New CNAE Version

When IBGE releases a new version (e.g., CNAE 2.4):

1. **Check `ibge-data-sources.md`** for new URLs
2. **Download the new file** and inspect its structure (column order, sheet name)
3. **Update `extract.js`** if column order or format changed
4. **Update `check-extraction.js`** if expected counts changed
5. **Update `data-schema.md`** if new fields are needed
6. **Run the full pipeline:** `npm run update`
7. **Update docs** with the new version info

## Handling New File Formats

### XLSX (already supported)
The `xlsx` library handles both `.xls` and `.xlsx`. No changes needed.

### ZIP files
Some older CNAE files come in `.zip` format. To support:
```bash
npm install adm-zip
```
```javascript
const AdmZip = require('adm-zip');
const zip = new AdmZip('file.zip');
zip.extractAllTo('./temp/', true);
// Then parse the extracted XLS/XLSX
```

### New formats
If IBGE starts publishing in CSV, ODS, or other formats:
1. Check if the `xlsx` library supports it (it supports many formats)
2. If not, find a suitable parser
3. Update `extract.js` to detect file format and use appropriate parser

## Troubleshooting

### "EXTRAÇÃO COM PROBLEMAS"

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| Wrong section count (≠21) | New section added | Update expected count in `check-extraction.js` |
| Wrong division count (≠87) | Structure changed | Re-analyze XLS structure |
| Wrong group count (≠285) | Structure changed | Re-analyze XLS structure |
| Wrong class count (≠673) | New classes added | Update expected count, verify data |
| Duplicates found | Extraction logic issue | Check row filtering in `extract.js` |
| Invalid codes | Format changed | Update regex in `check-extraction.js` |

### Download failures

```bash
# Check if URL is still valid
curl -I "https://cnae.ibge.gov.br/images/concla/downloads/revisao2007/PropCNAE20/CNAE20_EstruturaDetalhada.xls"

# If 404, check the download page for updated URLs
curl -s "https://cnae.ibge.gov.br/classificacoes/download-concla.html" | grep -i "cnae.*\.xls"
```
