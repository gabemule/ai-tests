# MVP — Similarity Score — Plan

> Last updated: 2026-05-20

## Context

Build a semantic similarity engine to validate user-provided activities against a pre-defined list of allowed activities. The system uses embeddings and vector similarity (cosine) to match activities, applying configurable thresholds to classify matches as approved, manual review, or rejected.

## Goals

1. Accept user activities via API (`POST /match`)
2. Generate semantic embeddings for all allowed activities (cached in memory at startup)
3. Compare user input embeddings against allowed activity embeddings using cosine similarity
4. Apply threshold rules and return the best match with score and status
5. Support swappable embedding models via adapter pattern (ADR-001)
6. Support swappable similarity search engines via adapter pattern (ADR-002)

## Scope

### In Scope (MVP)

- Load allowed activities from JSON file
- Generate embeddings using `sentence-transformers` (`all-MiniLM-L6-v2`)
- In-memory embedding cache
- Cosine similarity search with scikit-learn
- Configurable thresholds (approved >= 0.80, review 0.65-0.79, rejected < 0.65)
- REST API with `POST /match` endpoint
- Unit tests for core logic
- Setup tooling (Makefile, setup.sh)
- Documentation (README, ADRs)

### Out of Scope (Future)

- Model training or fine-tuning (zero-shot only)
- Database persistence (pgvector, vector DB)
- Reranking / cross-encoder second pass
- Feedback loop / learning from corrections
- Web UI
- Authentication (API key, OAuth)
- Rate limiting
- Batch processing
- CNAE table integration

## Decisions

### ADR-001: Embedding Adapter Pattern

Embedding services must be swappable via Protocol interface to allow testing different models without changing core logic.

**Why**: `all-MiniLM-L6-v2` is fast but not optimized for Portuguese. Future iterations need to test `multilingual-e5-base` or `BAAI/bge-m3` without rewriting the application.

### ADR-002: Similarity Search Adapter Pattern

Similarity search engines must be swappable to support evolution from in-memory (MVP) → pgvector (V2) → vector DB (V3).

**Why**: The MVP uses in-memory arrays with scikit-learn, but production will require pgvector or FAISS. The adapter pattern makes this transition plug-and-play.

### Tech Stack

- **Python 3.12+**: Best ML/NLP ecosystem
- **FastAPI**: Modern, fast, automatic OpenAPI docs
- **sentence-transformers**: Industry-standard embeddings
- **scikit-learn**: Mature, battle-tested cosine similarity
- **pytest**: Standard Python testing framework

## Phases

### Phase 1 — Documentation & ADRs

**Effort**: 1 hour

- [x] `@todo/CONTEXT.md`
- [ ] `@todo/MVP/PLAN.md` (this file)
- [ ] `@todo/MVP/PROGRESS.md`
- [ ] `@todo/FUTURE.md`
- [ ] `docs/adr/001-embedding-adapter-pattern.md`
- [ ] `docs/adr/002-similarity-search-adapter-pattern.md`

### Phase 2 — Project Setup

**Effort**: 1 hour

- [ ] `pyproject.toml` — dependencies (fastapi, uvicorn, sentence-transformers, scikit-learn, pytest)
- [ ] `Makefile` — targets: setup, install, run, test, lint, clean
- [ ] `setup.sh` — check/create venv, install dependencies
- [ ] `.gitignore` — venv, cache, etc.
- [ ] Directory structure (`app/`, `data/`, `tests/`, `docs/`)

### Phase 3 — Data Layer

**Effort**: 30 min

- [ ] `data/allowed_activities.json` — mock dataset (coleta de sangue, aplicação de vacina, etc.)
- [ ] `app/repositories/allowed_activities.py` — load JSON, return list of activities

### Phase 4 — Embedding Layer (Adapter — ADR-001)

**Effort**: 2 hours

- [ ] `app/embeddings/port.py` — `EmbeddingPort` (Protocol)
- [ ] `app/embeddings/sentence_transformer_adapter.py` — implementation with `all-MiniLM-L6-v2`
- [ ] `app/embeddings/cache.py` — in-memory cache, generate embeddings at startup

### Phase 5 — Similarity Engine (Adapter — ADR-002)

**Effort**: 2 hours

- [ ] `app/similarity/port.py` — `SimilaritySearchPort` (Protocol)
- [ ] `app/similarity/in_memory_adapter.py` — cosine similarity with scikit-learn
- [ ] `app/similarity/thresholds.py` — threshold classification logic

### Phase 6 — Service Layer

**Effort**: 1 hour

- [ ] `app/services/matcher_service.py` — orchestrates embedding → search → threshold → response

### Phase 7 — API Layer

**Effort**: 2 hours

- [ ] `app/core/config.py` — configuration (model name, thresholds, etc.)
- [ ] `app/api/schemas/match.py` — Pydantic request/response models
- [ ] `app/api/routes/match.py` — `POST /match` endpoint
- [ ] `app/main.py` — FastAPI app, startup event (load activities, generate embeddings)

### Phase 8 — Tests

**Effort**: 2 hours

- [ ] `tests/test_thresholds.py` — test threshold classification
- [ ] `tests/test_similarity.py` — test cosine similarity logic
- [ ] `tests/test_match_endpoint.py` — integration test for `/match` endpoint
- [ ] Validation dataset (known input → expected output)

### Phase 9 — Documentation

**Effort**: 1 hour

- [ ] `README.md` — setup instructions, usage examples, API documentation
- [ ] Update `@todo/CONTEXT.md` with final state

---

**Total Estimated Effort**: ~12 hours