# Data Schema — cnae.json Reference

## Overview

`cnae.json` contains an array of CNAE Class entries. Each entry represents one economic activity class with its full hierarchical context.

**Current stats:**
- 673 entries (one per class)
- Source: CNAE 2.0 Classes (Estrutura Detalhada)

## Schema

```typescript
interface CNAEEntry {
  // Primary identification
  codigo: string          // Class code (e.g., "01.11-3")
  titulo: string          // Class title/description

  // Hierarchical codes and descriptions
  secao_codigo: string    // Section code (A-U)
  secao_descricao: string // Section description
  divisao_codigo: string  // Division code (01-99)
  divisao_descricao: string
  grupo_codigo: string    // Group code (XX.X)
  grupo_descricao: string
  classe_codigo: string   // Class code (same as `codigo`)
  classe_descricao: string // Class description (same as `titulo`)

  // Derived fields
  hierarchy: string[]     // Breadcrumb array [section, division, group, class]
  texto_embedding: string // Concatenated text optimized for semantic search
  tokens: string[]        // Normalized, deduplicated, stopword-filtered tokens

  // Raw nested hierarchy
  raw_hierarchy: {
    secao: { codigo: string, descricao: string }
    divisao: { codigo: string, descricao: string }
    grupo: { codigo: string, descricao: string }
    classe: { codigo: string, descricao: string }
  }
}
```

## Field Details

### `codigo` / `classe_codigo`
- **Type:** `string`
- **Format:** `XX.XX-X` (regex: `/^\d{2}\.\d{2}-\d$/`)
- **Example:** `"01.11-3"`
- **Note:** Both fields contain the same value. `codigo` is the primary key.

### `titulo` / `classe_descricao`
- **Type:** `string`
- **Example:** `"Cultivo de cereais"`
- **Note:** Both fields contain the same value.

### `secao_codigo`
- **Type:** `string`
- **Format:** Single uppercase letter (A-U)
- **Example:** `"A"`
- **Possible values:** A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U

### `divisao_codigo`
- **Type:** `string`
- **Format:** Two-digit number (01-99)
- **Example:** `"01"`

### `grupo_codigo`
- **Type:** `string`
- **Format:** `XX.X`
- **Example:** `"01.1"`

### `hierarchy`
- **Type:** `string[]`
- **Length:** 4 elements (always)
- **Order:** `[section_desc, division_desc, group_desc, class_desc]`
- **Example:**
  ```json
  [
    "AGRICULTURA, PECUÁRIA, PRODUÇÃO FLORESTAL, PESCA E AQÜICULTURA",
    "AGRICULTURA, PECUÁRIA E SERVIÇOS RELACIONADOS",
    "Produção de lavouras temporárias",
    "Cultivo de cereais"
  ]
  ```

### `texto_embedding`
- **Type:** `string`
- **Purpose:** Optimized for semantic search / embedding generation
- **Format:** `"{class}. {group}. {division}. {section}. CNAE {code}"`
- **Example:** `"Cultivo de cereais. Produção de lavouras temporárias. AGRICULTURA, PECUÁRIA E SERVIÇOS RELACIONADOS. AGRICULTURA, PECUÁRIA, PRODUÇÃO FLORESTAL, PESCA E AQÜICULTURA. CNAE 01.11-3"`
- **Note:** Most specific level first (class), broadest last (section). Includes the CNAE code at the end for retrieval context.

### `tokens`
- **Type:** `string[]`
- **Purpose:** Normalized keywords for text matching / TF-IDF
- **Processing:**
  1. Concatenate all hierarchy descriptions
  2. Normalize (remove accents via NFD decomposition)
  3. Convert to lowercase
  4. Split into words
  5. Remove words ≤ 2 characters
  6. Remove Portuguese stopwords (`de`, `da`, `do`, `e`, `em`, `a`, `o`, `para`, `com`, `por`, `na`, `no`, etc.)
  7. Deduplicate
- **Example:** `["cultivo", "cereais", "producao", "lavouras", "temporarias", "agricultura", "pecuaria", ...]`

### `raw_hierarchy`
- **Type:** `object`
- **Purpose:** Structured access to each hierarchy level
- **Example:**
  ```json
  {
    "secao": { "codigo": "A", "descricao": "AGRICULTURA..." },
    "divisao": { "codigo": "01", "descricao": "AGRICULTURA..." },
    "grupo": { "codigo": "01.1", "descricao": "Produção de lavouras temporárias" },
    "classe": { "codigo": "01.11-3", "descricao": "Cultivo de cereais" }
  }
  ```

## Validation Rules

These rules are enforced by `check-extraction.js`:

| Check | Expected Value |
|-------|---------------|
| Total entries | 673 |
| Unique sections | 21 |
| Unique divisions | 87 |
| Unique groups | 285 |
| Unique classes | 673 |
| Duplicates | 0 |
| Invalid codes | 0 |
| Code format | `/^\d{2}\.\d{2}-\d$/` |

## Usage Examples

### Find by code
```javascript
const cnae = require('./cnae.json');
const entry = cnae.find(c => c.codigo === '62.01-5');
// → "Desenvolvimento de programas de computador sob encomenda"
```

### Find by section
```javascript
const techActivities = cnae.filter(c => c.secao_codigo === 'J');
// → All "Informação e comunicação" activities
```

### Search by text
```javascript
const results = cnae.filter(c =>
  c.texto_embedding.toLowerCase().includes('software')
);
```

### Use tokens for matching
```javascript
const results = cnae.filter(c =>
  c.tokens.includes('software') || c.tokens.includes('computador')
);
```

## Future Schema Extensions

When subclasses are added (CNAE 2.3), each entry may include:

```typescript
interface CNAEEntryWithSubclass extends CNAEEntry {
  subclasse_codigo: string    // e.g., "0111-3/01"
  subclasse_descricao: string // e.g., "Cultivo de arroz"
}
```

The total entry count will increase from 673 to ~1300+.
