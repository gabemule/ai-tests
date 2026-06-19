# ESTIMATION-FRAMEWORK — Plan

## Context

We need a lightweight visual tool to estimate project timelines. The user wants a
single-file HTML app (no build step) that behaves like a mini-Gantt: three parallel
schedules (pessimistic, realistic, optimistic) where each row is a project task and each
column is a week split into 5 working-day dots. Marking day-dots defines the duration of
each task per schedule. The app must export/import JSON so timelines can be saved,
reused and shared.

Original brief lives in `SYSTEM_PROMPT.md` (same package).

## Goals

- Single self-contained `index.html` (HTML + CSS + JS inline), opens directly in a browser.
- Three stacked schedules in order: **Pessimista → Realista → Otimista** (longest → shortest).
- Rows = tasks (add / rename / remove / color). Rows are **synced across the 3 schedules**
  by default, with a config toggle to allow independent rows.
- Columns = weeks; each week has **5 day-dots** (1 working day each). Add/remove weeks.
- Day marking: click toggles a single day; click-and-drag paints/clears a range
  (paint vs clear decided by the first cell touched).
- Live totals per row and per schedule: **working days** and **weeks** (days ÷ 5, 1 decimal).
- Editable **project name**.
- Persistence via `localStorage` + Export/Import `.json` file.
- Dark navy-gray theme.

## Scope

### In
- All goals above (MVP).
- JSON schema `version: 1` for export/import.

### Out (for now)
- Calendar dates (only relative estimation in days/weeks).
- Vite/bundler build (may come later if the file grows).
- Multi-project management, server sync, auth.
- Dependencies between tasks, drag-to-reorder rows (nice-to-have, later).

## Decisions

- **Single file**: keep everything in `index.html`. JS organized in logical sections
  (state, render, events, persistence) to ease a future Vite migration.
- **Vanilla JS**, no frameworks/libraries — zero dependencies.
- **Day granularity**: a column = 1 week = 5 day-dots. Total days = number of marked dots;
  total weeks = days / 5.
- **Synced rows**: a single `rows[]` array is the source of truth for row identity
  (id, name, color). Each schedule only stores its own `marks` keyed by rowId. The sync
  toggle, when off, is a future-friendly flag; MVP focuses on synced behavior.
- **Marks storage**: `marks[rowId]` = array of marked global day indices (0-based,
  `0 .. weeks*5 - 1`).
- **State**: single in-memory object mirrored to `localStorage` on every change.

## JSON Schema (v1)

```json
{
  "version": 1,
  "projectName": "Meu Projeto",
  "weeks": 8,
  "daysPerWeek": 5,
  "syncRows": true,
  "rows": [{ "id": "r1", "name": "Setup de Projeto", "color": "#5b8def" }],
  "schedules": {
    "pessimista": { "marks": { "r1": [0, 1, 2] } },
    "realista":   { "marks": { "r1": [0, 1] } },
    "otimista":   { "marks": { "r1": [0] } }
  }
}
```

## Phases

1. **Base structure** → `index.html`, layout, dark theme, in-memory state. *verify:* opens in browser, layout renders.
2. **Week/day grid** → render 3 grids, columns = weeks with 5 dots, +/− weeks. *verify:* add/remove week updates all 3.
3. **Rows** → add/rename/remove/color, synced across schedules + toggle. *verify:* adding a row appears in all 3.
4. **Marking** → click toggle + drag paint/clear, independent per schedule. *verify:* marking days works per grid.
5. **Totals** → working days + weeks per row and per schedule. *verify:* totals match number of marks.
6. **Persistence + Export/Import JSON** → localStorage + download/upload `.json`. *verify:* export, reload, import restores identical state.
7. **Polish** → theme, basic responsiveness, UX micro-adjustments. *verify:* visual review.
