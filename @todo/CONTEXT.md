# CONTEXT.md — Project Knowledge Base

> Maintained by AI for context recovery between sessions.
> Last updated: 2026-05-20

## Stack & Infra

- **Language**: Python 3.12+
- **Framework**: FastAPI + Uvicorn
- **ML/NLP**: sentence-transformers (`all-MiniLM-L6-v2`), scikit-learn
- **Testing**: pytest
- **Deployment**: Docker (future: Railway, Render, ECS)
- **Persistence**: JSON in memory (MVP) → pgvector (V2) → FAISS/Qdrant (V3)

## Architecture

The project follows a **Port & Adapter** pattern for extensibility:

```
Request → API Layer (FastAPI)
           ↓
       Service Layer (MatcherService)
           ↓
       Embedding Layer (Adapter — ADR-001)
           ↓
       Similarity Search Layer (Adapter — ADR-002)
           ↓
       Threshold Engine (Business Rules)
           ↓
       Response
```

### Directory Structure

```
app/
├── main.py                    # FastAPI app, startup logic
├── core/config.py             # Configuration
├── api/
│   ├── routes/match.py        # POST /match endpoint
│   └── schemas/match.py       # Pydantic models
├── embeddings/
│   ├── port.py                # EmbeddingPort (Protocol)
│   ├── sentence_transformer_adapter.py
│   └── cache.py               # In-memory embedding cache
├── similarity/
│   ├── port.py                # SimilaritySearchPort (Protocol)
│   ├── in_memory_adapter.py   # Cosine similarity with scikit-learn
│   └── thresholds.py          # Threshold rules
├── repositories/
│   └── allowed_activities.py  # Loads from JSON
└── services/
    └── matcher_service.py     # Orchestrates the flow
```

## Conventions

- **Code & Documentation**: English only
- **Naming**: snake_case for files/functions, PascalCase for classes
- **Architecture Decisions**: documented in `docs/adr/`
- **Design Principles**:
  - **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
  - **DRY**: Don't Repeat Yourself — extract reusable logic
  - **YAGNI**: You Aren't Gonna Need It — no speculative features, build what's needed now
- **Adapter Pattern**: all external dependencies (embedding models, similarity engines) must be behind a Protocol interface

## Current State

- **Phase**: MVP Development
- **Status**: Initial setup
- **Working**: Nothing yet — starting from scratch
- **In Progress**: Documentation and project structure setup

## Active Decisions (ADRs)

- **ADR-001**: Embedding Adapter Pattern — embedding services must be swappable via Protocol interface to allow testing different multilingual models without changing core logic
- **ADR-002**: Similarity Search Adapter Pattern — similarity search engines must be swappable to support evolution from in-memory (MVP) → pgvector (V2) → vector DB (V3)

## Known Pitfalls

- **False Positives**: semantically similar but functionally different activities (e.g., "cirurgia cardíaca" matching "consulta cardiológica") — mitigated by conservative thresholds and manual review zone (0.65-0.79)
- **Threshold Sensitivity**: thresholds are domain-specific and may need tuning based on real-world feedback
- **Model Limitations**: `all-MiniLM-L6-v2` is not optimized for Portuguese — future iterations should test `multilingual-e5-base` or `BAAI/bge-m3`
- **No Training**: this is a zero-shot similarity engine — it does not learn from feedback (V2+ feature)