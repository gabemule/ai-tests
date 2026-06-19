# my-linter — Context (Idea Capture)

> Idea-capture document to preserve the concept. Convert to a real PLAN when prioritized.
> Last updated: 2026-06-19

## TL;DR

A **company-wide code-conformance toolchain** that makes devs follow established standards
for our internal libraries (Design System, helpers/utils, SDK, etc.).

Built on **deterministic linting** (ESLint/TypeScript). AI is an **optional assistance layer**
(explain + fix the hard cases) — it never decides whether something is a violation.

Three layers:

1. **Linters** — a shared `core` config + one plugin per internal library, composed together.
2. **Rule generation** — auto-extract a *catalog* from each library's types/interfaces +
   a human-curated *intent manual*.
3. **IDE extension (VS Code + JetBrains)** — reads lint errors and uses RAG + an LLM
   (Anthropic API key) to explain the violation, link the doc, and propose a fix when the
   deterministic auto-fix can't handle it.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  A. RULE GENERATOR  (runs in each library's CI, versioned)    │
│     ts-morph reads the lib's .d.ts → CATALOG (what exists,     │
│       with which signatures) — auto-generated                 │
│     + human-curated INTENT MANUAL (use X not Y, never do Z)   │
│     → publishes @company/eslint-plugin-<lib>@x.y.z            │
│       (version tracks the library via peerDependency)         │
└──────────────────────────────────────────────────────────────┘
                          ↓ installed in projects
┌──────────────────────────────────────────────────────────────┐
│  B. LINTERS  (100% local / deterministic, no AI)              │
│     core.linter   → general, lib-agnostic code-quality rules  │
│     <lib>.linter  → per-library rules (catalog ⊕ intent)      │
│     + mechanical auto-fix where the transform is safe         │
└──────────────────────────────────────────────────────────────┘
                          ↓ lint errors with no trivial auto-fix
┌──────────────────────────────────────────────────────────────┐
│  C. IDE EXTENSION  (VS Code + JetBrains, optional AI layer)   │
│     reads lint errors → RAG fetches the rule's spec/doc       │
│     → LLM (Anthropic API key) explains the violation,         │
│       links the doc, and proposes a fix                       │
└──────────────────────────────────────────────────────────────┘
```

## Layer B — Linters & composition

The idiomatic ESLint **shareable-config + plugin** pattern.

### core.linter (general, lib-agnostic)
General code-quality + convention rules currently left loose in per-project configs:
naming, `no-unused`, architecture patterns, etc. Extends ready-made configs (airbnb/etc.).

**Separation to keep (avoid a classic conflict):**
- **Style** (indentation, import ordering, quotes) → owned by **Prettier**, not ESLint.
- **Quality/convention** (naming, no-unused, architecture) → owned by `core.linter`.

So `core` is two small packages: `eslint-config-core` (quality) + a shared `prettier-config`.

### lib.linter (one per internal library)
`ds.linter`, `helpers.linter`, `sdk.linter`, ... — each = catalog (auto) ⊕ intent (human).

### Composition in a final project
```js
// eslint.config.js
export default [
  ...core,       // general rules
  ...dsLinter,   // if it uses the Design System
  ...sdkLinter,  // if it uses the SDK
]
```
A project enables only the linters for the libraries it actually uses.

### Auto-attach: installing a lib brings its rules

Goal: **adding a library to a project automatically brings its lint rules** — ideally with no
extra manual step. Three levels, from simplest to most "magical":

**Level 1 — the lib ships its own plugin (recommended baseline).**
The library declares its rule package as a dependency of itself:
```jsonc
// @company/design-system package.json
{
  "dependencies": { "@company/eslint-plugin-ds": "2.1.0" }  // travels with the lib
}
```
Installing `@company/design-system` pulls `eslint-plugin-ds` automatically (no separate
`npm install` for the rules). The version is pinned to the lib version → rules always match
the installed lib. The project still references the preset once in its config.

**Level 2 — auto-discovery preset (no per-lib config edit).**
A single meta-config detects which company libs are installed and injects each one's rules:
```js
// eslint.config.js
import company from "@company/eslint-config"   // one import
export default [...company.auto()]             // scans node_modules → loads ds/sdk/helpers rules it finds
```
`company.auto()` looks up installed `@company/*` libs, finds the rule preset each one exposes,
and composes them. Add a new lib later → its rules appear automatically on next lint, **without
editing `eslint.config.js`**.

**Level 3 — setup helper / postinstall (optional, opt-in).**
A small CLI/codemod (`npx @company/lint-setup`) — or an opt-in `postinstall` hook — detects
newly installed company libs and writes/updates the `eslint.config.js` for the team. Useful for
onboarding and CI scaffolding. Kept opt-in because silent `postinstall` edits are intrusive.

**Recommendation:** Level 1 (rules travel with the lib) + Level 2 (`auto()` preset) gives the
"install the lib → get its rules" experience with zero per-lib wiring, while staying explicit
and debuggable. Level 3 is sugar for onboarding.

**Caveat:** ESLint must still resolve plugins; with flat-config this is straightforward since
plugins are imported as modules. Pin rule-package versions via the lib's `dependencies` (not a
loose range) so a lib bump and its rules move together.

## Layer A — Rule generation

Each `lib.linter` rule set has **two layers with different origins**:

| Layer | Origin | Automation |
|---|---|---|
| **Catalog** — "what exists, with which signature" | extracted from the lib's `.d.ts` (ts-morph) | ✅ 100% auto-generated; regenerate when the lib changes |
| **Intent manual** — "use X instead of Y", "never do Z" | human policy decision | ✍️ manual, versioned by hand, evolves slowly |

Final rule = `catalog (auto) ⊕ intent (human)`.

**Types/interfaces give the *vocabulary*, not the *policy*:**
- The lib tells you `DsButton` exists with props `variant`/`size` → catalog.
- The lib does **not** know raw `<button>` is forbidden in its favor → that's policy,
  someone must declare it (the intent manual).

### Versioned, library-coupled generation

```
New library version published
        ↓
Library CI (or scheduled job) runs the generator
        ↓ extract new catalog from the new .d.ts
        ↓ diff against previous catalog
        ↓
Publish new rule package: @company/eslint-plugin-ds@2.1.0
        ↓
Projects bumping the lib to v2 → bump the eslint-plugin too (peerDependency)
```

- The **catalog** updates itself when the lib changes a parameter/signature.
- The **intent manual** only changes when *we* change policy.
- The **catalog diff** detects breaking changes ("`DsButton` removed prop `color`") and can
  even generate migration rules / codemods (how big libs like MUI ship upgrades).

## Layer C — IDE extension (VS Code + JetBrains)

- Reads the lint errors produced by Layer B.
- For errors **without** a safe mechanical auto-fix, calls an AI assist flow:
  - **RAG** retrieves the relevant spec/doc for the violated rule.
  - **LLM (Anthropic API key)** explains *why* it's a violation, links the doc, and proposes
    a contextual fix.
- AI **never decides** if something is a violation — the deterministic linter already did,
  with 100% confidence. AI only **explains and fixes** → no false positives.
- Target editors: **VS Code** and **JetBrains**, both consuming the same lint output + the
  same AI assist service (configured with the user's Anthropic API key).

## Building the intent manual — pattern mining + human review

The intent manual is populated by **AI proposing, human disposing**:

```
Existing code (the "good"/exemplary company repos)
        ↓ AI mines recurring patterns
"DsButton used in 47 files; raw <button> in 3"
"DS imports always from @company/ds, never from subpaths"
        ↓ AI proposes candidate rules (draft + evidence)
        ↓ HUMAN reviews each one → keep / adjust / reject
        ↓
Curated intent manual (versioned)
```

### Pitfall: "frequency ≠ rule"
Existing code mixes the **gold standard** with **tech debt**. If 80% of legacy code uses an
anti-pattern, naive mining could "learn" it as a rule.
**Mitigation:** point the miner at a **curated corpus** (the Design System itself, model
projects) — "learn from the best", not "from the majority".

### Candidate-rule card (makes review a 5-second yes/no)
```yaml
- id: prefer-ds-button
  status: PROPOSED          # human flips to APPROVED / REJECTED
  intent: "Use DsButton instead of native <button>"
  evidence:
    follows: 47             # files already following
    violates: 3
    examples_good: ["src/checkout/PayButton.tsx:12"]
    examples_bad:  ["src/legacy/Form.tsx:88"]
  autofix: safe             # safe | manual | none
  confidence: high
```

### Review flow
1. AI mines patterns → emits candidate-rule cards (`status: PROPOSED`).
2. Human reviews each card with evidence on screen → `APPROVED` / `REJECTED` / adjust.
3. Approved rules → AI translates into ESLint rule code (mechanical).
4. Each rule ships with a **test suite** (`example code → expected violations`).

### Roles — where AI fits (and where it doesn't)
| Step | Owner | Why |
|---|---|---|
| Mine patterns from code | 🤖 AI | grunt work, scales |
| Propose rule + evidence | 🤖 AI | generates structured draft |
| **Approve / adjust / reject** | 👤 Human | judgment — the real asset |
| Convert approved rule → ESLint code | 🤖 AI | mechanical translation |
| Rule test suite | 🤖 AI proposes, 👤 validates | ensures the rule catches the right thing |

### Rule test suite (per rule)
```yaml
- code: "<button onClick={fn}>Salvar</button>"
  expect: fail
  violations:
    - rule: "prefer-ds-button"
      message: "Use DsButton instead of native <button>"
- code: "<DsButton variant='primary' onClick={fn}>Salvar</DsButton>"
  expect: pass
```

## Open questions / to decide before a real PLAN

- Packaging: monorepo (one repo, many packages) vs. per-library repos for the plugins?
- ESLint flat-config only, or also legacy `.eslintrc` support?
- Where does the IDE extension's RAG corpus live and how is it updated on lib version bumps?
- JetBrains: native plugin vs. LSP-based reuse of the VS Code logic?
- Mechanical auto-fix coverage target before the AI layer is worth building.

## Status

**Idea only.** No code, no execution commitment. Convert to `PLAN.md` + `PROGRESS.md` when
prioritized.
