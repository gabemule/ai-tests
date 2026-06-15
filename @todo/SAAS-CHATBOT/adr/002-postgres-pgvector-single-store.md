# ADR 002 — Postgres + pgvector as the single store

**Status:** Accepted · 2026-06-14

## Context

A multi-tenant RAG platform needs both relational data (orgs, bots, members, keys, documents,
conversations) and a vector store for retrieval. Running a separate dedicated vector DB adds an extra
system to operate and a second consistency boundary.

## Decision

Use **Postgres + pgvector** as the single store — relational data and vectors live together. It is
the simplest correct multi-tenant vector setup and keeps one source of truth.

## Consequences

- Tenant isolation is enforced in the same store via Row-Level Security (ADR 016).
- Object storage (S3-compatible / Supabase Storage) is still used for **raw uploaded files**; only
  parsed chunks + vectors land in pgvector.
- Scaling is handled by graduating Postgres compute tiers (see `PRICING.md` §1.1/§1.2), not by
  adding a separate vector service.
