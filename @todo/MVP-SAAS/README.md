# MVP-SAAS — Whitelabel RAG Chatbot Platform

> Active workspace for the whitelabel RAG chatbot platform.
> Rebuilt from scratch on a **feature-graph model** (showcase-first).
> Last updated: 2026-06-19

---

## What this is

A **whitelabel RAG chatbot platform**: a tenant uploads documents, configures a bot
(prompt, guardrails, LLM mode, allowed domains), and embeds a chat widget on their own
site via a `<script>` snippet — answering grounded in **their** documents.

Built **on top of** the monorepo's adapter libraries (`llm-adapters`,
`embedding-adapters`) — a **product shell** around an existing engine, not a RAG
reimplementation.

## How to navigate

| File | Purpose |
|---|---|
| `README.md` *(this)* | Entry point — what it is, how to navigate, status |
| `CONTEXT.md` | Compiled project knowledge (read first on a new session) |
| `PROGRESS.md` | Source of truth for "where are we" |
| `ARCHITECTURE.md` | Concept + diagrams (components, ER, flows) |
| `adr/` | Architecture Decision Records (the *why*) |
| `FEATURES/` | **The primary structure** — one folder per independent feature |
| `FEATURES/README.md` | Feature catalog: dependency graph + recommended queue |
| `PRICING/` | Economic model (margin thesis, plans) — distilled |
| `research-app/` | Live model-pricing tooling (Vite + lowdb OpenRouter/AA scanner) |

## The model in one line

This project is organized as a **graph of independent features** with explicit
dependencies (hard = blocks, soft = improves). Phases (F1–F4) are a *derived view*,
not the primary structure. See `FEATURES/README.md`.

## Strategic intent

**Showcase first, revenue close behind.** The dominant goal is to demonstrate
end-to-end AI product engineering (multi-tenant RAG, ingestion pipeline, retrieval
quality, distribution). Revenue features (wallet, routing, billing) are real but
sequenced after the showcase core.

## Incubation

Lives in `ai-tests` (incubator) while embryonic; **graduates to its own repo** before
publish/deploy. Keep dependencies on monorepo siblings (`llm-adapters`,
`embedding-adapters`) clean and explicit so the extraction stays mechanical.
