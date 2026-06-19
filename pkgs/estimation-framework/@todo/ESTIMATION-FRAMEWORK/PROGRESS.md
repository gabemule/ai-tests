# ESTIMATION-FRAMEWORK — Progress

**Status:** 8/8 phases · Phase: Complete (MVP + reorder)

## Current Focus
MVP + reordenação de etapas (drag-and-drop) implementados.
Next step: feedback do usuário / nice-to-haves (sync de linhas ao adicionar/remover quando toggle off, datas).
Blocker: none


## Progress

### Phase 1 — Base structure
- [x] `index.html` skeleton (HTML + CSS + JS inline)
- [x] Dark navy-gray theme
- [x] In-memory state object + default seed
- [x] Header (project name, toolbar buttons)

### Phase 2 — Week/day grid
- [x] Render 3 stacked schedules (Pessimista, Realista, Otimista)
- [x] Columns = weeks, each with 5 day-dots
- [x] Add / remove week controls

### Phase 3 — Rows
- [x] Add row
- [x] Rename row
- [x] Remove row
- [x] Row color picker
- [x] Rows shared across schedules + sync toggle (flag persisted)

### Phase 4 — Marking
- [x] Click toggles single day
- [x] Click-and-drag paint/clear range
- [x] Independent marks per schedule

### Phase 5 — Totals
- [x] Per-row total (days + weeks)
- [x] Per-schedule total (days + weeks)

### Phase 6 — Persistence + Export/Import
- [x] Auto-save to localStorage
- [x] Load from localStorage on init
- [x] Export JSON (download)
- [x] Import JSON (upload) with normalize/validation
- [x] Clear button (reset to default with confirmation)

### Phase 7 — Polish
- [x] Visual review / responsiveness (sticky task column, horizontal scroll)
- [x] Toast feedback for export/import
- [x] Width toggle (contained ↔ full-width), persisted in localStorage (UI-only key)

### Phase 8 — Reorder rows (drag-and-drop)
- [x] Left-side drag handle (⠿) per row
- [x] Native HTML5 DnD on `<tr>`, gated by handle (mousedown enables `draggable`)
- [x] `moveRow(fromId, toId, after)` reorders `rows[]` (reflects in all 3 grids; marks keyed by id stay correct)
- [x] Drop-indicator (before/after) visual feedback

## Decisions Made During Execution

- 2026-06-15: MVP keeps everything in a single `index.html`; rows are shared across the 3 schedules (single `rows[]`), marks independent per schedule. `syncRows` flag is persisted but, since rows are already shared, the "off" branch (independent rows per schedule) is left as a future enhancement.
- 2026-06-15: Import uses `normalize()` to validate fields and clamp mark indices to current week range.
- 2026-06-15: Validado no navegador — render dos 3 grids, marcação de dia e totais (1d · 0,2sem) funcionando.
- 2026-06-15: Reorder (Opção B) — handle à esquerda; DnD nativo isolado do paint dos dots habilitando `tr.draggable` apenas enquanto o handle está pressionado (mousedown/mouseup). Reorder atua só no `rows[]`; como `marks` são keyed por id, as marcações seguem a etapa nos 3 grids.

