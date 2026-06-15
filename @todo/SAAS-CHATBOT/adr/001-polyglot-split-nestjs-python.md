# ADR 001 — Polyglot split (NestJS API + Python ingestion worker + Next.js front)

**Status:** Accepted · 2026-06-14

## Context

The platform powers chat (`llm-adapters`) and query-time embedding (`embedding-adapters`), and also
runs heavy document ingestion (parse → chunk → embed). The adapters ship in **both** Node and Python
builds. Document parsing is dramatically stronger in the Python ecosystem (pypdf/pdfminer/
unstructured/python-docx/pandas/Tesseract); chat and the front-end favour a unified TS stack.

## Decision

Split by workload, each side using the adapters' native build:

- **`chatbot-api` — NestJS (Node/TS):** chat (SSE), query-time embedding, auth, tenancy, retrieval,
  usage/limits, and ingestion **orchestration** (enqueues jobs). Unifies the TS stack with the
  Next.js portal and the widget.
- **`chatbot-ingestion-worker` — Python:** the muscle. Consumes ingestion jobs, parses/chunks/embeds
  with the Python `embedding-adapters`, upserts into pgvector. Heavy/slow work stays off the API.
- **`chatbot-portal` — Next.js**, **`chatbot-widget` — embeddable script.**

## Consequences

- The **API↔worker handoff** becomes the "sacred seam" — an explicit, versioned job contract
  validated by both sides (see `CONTEXT.md` gotchas; ADR 017 for the embedding-parity invariant).
- Two builds of `embedding-adapters` are in play → the embedding model must be locked in a single
  shared config (ADR 017), or vectors won't share a space.
