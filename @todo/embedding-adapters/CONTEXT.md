# embedding-adapters — Project Knowledge Base

> Maintained by Cline for context recovery between sessions.
> Last updated: 2026-03-06

## Purpose

Reusable TypeScript and Python library for unified embedding generation across multiple providers. Eliminates the need to reimplement embedding logic in every project that needs semantic similarity, RAG, or vector search.

## Library Scope Philosophy

> **Guiding principle:** the library owns what you reimplement *identically* in
> every embedding project (repeatable infrastructure). The application owns what
> *changes* per project (business rules, storage, search logic).
>
> **The test:** "Would I rewrite this the same way in the next project?" → if yes,
> it belongs in the library; if it varies per project, it stays in the app.

| ✅ Belongs in the library (repeatable infra) | ❌ Stays in the app (business logic) |
|---|---|
| Model cache (memory + disk) for local models | Chunking strategy / document splitting |
| Automatic batching (split large inputs) | Vector store / persistence (ChromaDB, Pinecone...) |
| Optional vector normalization (L2) | Similarity search / ranking |
| Lazy loading + warm-up for local models | Embedding selection / collection management |
| Retry with backoff (API providers) | RAG orchestration |

This boundary is why model caching, batching, normalization and warm-up —
previously parked in `FUTURE.md` Phase 3/4 — are reclassified as **core** (see below):
they are precisely the "boring middle" every embedding project rewrites by hand.

## Core Features (beyond the minimal interface)

These move from "distant future" to part of the library's identity. They are the
real reason to depend on the lib instead of calling the model/SDK directly:

- **Model cache (memory + disk)** — local models (SentenceTransformers) are expensive
  to load; caching loaded models is mandatory and identical in every project.
- **Automatic batching** — split large `encode_batch` inputs into provider-safe batches.
- **Optional normalization** — L2-normalize vectors (affects cosine similarity), opt-in.
- **Lazy loading + warm-up** — defer model load until first use; explicit `warmup()`.
- **Retry with backoff** — for API providers (OpenAI), transient errors retried.

### Reference implementation (proven in production)

`context-ai` (xctx) already implements this boring middle by hand and it is the
**living spec** for these features — copy the design, don't reinvent it:
- `context-ai/src/core/embeddings/model_manager.py` — model cache (memory + disk),
  batching (`batch_size`, `LARGE_BATCH_THRESHOLD`), lazy loading, progress tracking,
  model validation. The `EmbeddingModelManager` orchestration is ≈ the `EmbeddingPort`
  + provider plumbing this library generalizes.

### Language order: Python-first

**Decision:** implement **Python first**, then mirror the **identical interface** in
TypeScript. (SentenceTransformers is Python-only initially; TS local models need ONNX
— deferred. Python-first is the agreed order, TS following once the contract is stable.)

## Stack & Infra


### Languages
- **TypeScript** - Primary implementation for Node.js projects
- **Python** - Primary implementation for Python projects

### Providers (MVP → Future)
- **OpenAI** (MVP) - text-embedding-3-small, text-embedding-3-large
- **SentenceTransformers** (MVP) - Local models (all-MiniLM-L6-v2, multilingual-e5-base, etc.)
- **Cohere** (Phase 2) - embed-multilingual-v3.0
- **VoyageAI** (Phase 2) - voyage-2
- **Ollama** (Phase 2) - Local embedding models
- **HuggingFace** (Phase 2) - Any HuggingFace model

### Distribution
- **GitHub URL dependencies** - `npm install github:gabemule/embedding-adapters`
- No npm/PyPI publishing initially (can add later)

## Architecture

### Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────┐
│         Application Layer           │
│   (Your code using the library)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       EmbeddingPort (Protocol)      │
│  - encode(text) → vector            │
│  - encodeBatch(texts) → vectors     │
│  - getDimension() → int             │
└──────────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐      ┌──────────────┐
│  OpenAI  │      │ SentenceTrans│
│ Adapter  │      │ former Adapter│
└──────────┘      └──────────────┘
```

### Key Components

1. **EmbeddingPort (Protocol/Interface)** - Defines the contract all adapters must implement
2. **Adapters** - Provider-specific implementations (OpenAIAdapter, SentenceTransformerAdapter, etc.)
3. **Factory (EmbeddingProvider)** - Creates the correct adapter based on config
4. **Types** - Shared types for configs, responses

### Design Principles

- **Dependency Inversion** - Application depends on EmbeddingPort, not concrete adapters
- **Single Responsibility** - Each adapter handles one provider only
- **Open/Closed** - Easy to add new providers without modifying existing code
- **Interface Segregation** - Clean, minimal interface (encode, encodeBatch, getDimension)

## Conventions

### File Organization
```
typescript/src/
  port.ts              # EmbeddingPort interface
  provider.ts          # EmbeddingProvider factory
  types.ts             # Shared types
  adapters/
    openai.ts          # OpenAI implementation
    sentence-transformer.ts  # SentenceTransformers implementation
    ...

python/embedding_adapters/
  port.py              # EmbeddingPort Protocol
  provider.py          # EmbeddingProvider factory
  types.py             # Shared types
  adapters/
    openai_adapter.py  # OpenAI implementation
    sentence_transformer_adapter.py
    ...
```

### Naming Conventions
- **TypeScript**: PascalCase for classes, camelCase for methods
- **Python**: snake_case for everything except class names (PascalCase)
- **Adapters**: `{Provider}Adapter` (e.g., `OpenAIAdapter`, `SentenceTransformerAdapter`)
- **Port**: `EmbeddingPort` (singular, describes the interface)

### Testing Strategy
- Unit tests for each adapter
- Integration tests with real API calls (optional, requires API keys)
- Mock tests for CI/CD (no API keys needed)
- Dimension consistency tests (ensure all adapters return correct dimensions)

## Current State

**Status:** Planning phase
**Next:** Create MVP with OpenAI + SentenceTransformers adapters (TypeScript + Python)

## Active Decisions (ADRs)

### ADR-001: Separate embedding-adapters from llm-adapters
**Decision:** Create two separate libraries instead of one monolithic package.
**Rationale:** 
- Single Responsibility Principle
- Dependency isolation (embeddings don't need chat SDKs)
- Independent evolution (can swap embedding provider without affecting chat)
- Reusability (similarity-score already has EmbeddingPort that can be extracted)

### ADR-002: Use Adapter Pattern with Protocol/Interface
**Decision:** All providers implement a common EmbeddingPort interface.
**Rationale:**
- Proven pattern (already used successfully in similarity-score)
- Easy to swap providers without code changes
- Testability (can mock the port)
- SOLID principles compliance

### ADR-003: Factory Pattern for Provider Creation
**Decision:** Use `EmbeddingProvider.create()` factory instead of direct instantiation.
**Rationale:**
- Hides provider-specific initialization complexity
- Single entry point for all providers
- Easy to add new providers without breaking existing code
- Clean API: `EmbeddingProvider.create({ provider: 'openai', ... })`

### ADR-004: Include Local Models in MVP (SentenceTransformers)
**Decision:** Include both API-based (OpenAI) and local (SentenceTransformers) in MVP.
**Rationale:**
- Demonstrates flexibility (API vs local)
- SentenceTransformers already proven in similarity-score
- Privacy-first option (no API calls)
- Cost-effective for high-volume use cases

### ADR-005: GitHub URL Distribution (MVP)
**Decision:** Distribute via GitHub URLs, not npm/PyPI initially.
**Rationale:**
- Faster iteration (no publish step)
- Private control (no public package maintenance)
- Can migrate to npm/PyPI later if needed
- Sufficient for personal/team use

## Known Pitfalls

### Embedding Dimension Differences
- **Different models have different dimensions** - OpenAI (1536), MiniLM (384), etc.
- **Mitigation:** `getDimension()` method returns dimension, document clearly in README

### Model Loading Time (Local Models)
- **SentenceTransformers models take time to load** - First call is slow
- **Mitigation:** Lazy loading, cache loaded models, document warm-up strategy

### API Rate Limits (OpenAI)
- **OpenAI has rate limits** - Can hit limits with large batches
- **Mitigation:** Batch size limits, retry logic (future enhancement)

### Memory Usage (Local Models)
- **Large models consume significant RAM** - Can cause OOM errors
- **Mitigation:** Document memory requirements, support model selection

### Normalization Differences
- **Some models return normalized vectors, others don't** - Affects cosine similarity
- **Mitigation:** Document normalization behavior per adapter, consider auto-normalize option

### TypeScript/Python Parity
- **Risk of divergence** - TS and Python implementations might drift apart
- **Mitigation:** Keep interfaces identical, test both with same scenarios

## Integration with similarity-score

The `similarity-score` project already has a working `EmbeddingPort` and `SentenceTransformerAdapter`. This library will:
1. Extract and generalize that pattern
2. Add OpenAI adapter
3. Add more providers over time
4. Eventually, `similarity-score` can depend on `embedding-adapters` instead of maintaining its own
