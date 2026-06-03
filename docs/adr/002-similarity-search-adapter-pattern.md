# ADR 002 — Similarity Search Adapter Pattern

## Status

Accepted

## Context

The MVP performs similarity search using in-memory numpy arrays and scikit-learn's `cosine_similarity` function. This works well for small datasets (~10,000 activities) but does not scale to production volumes.

As the system grows, we need to transition through multiple stages:

| Stage | Storage | Search Method | Scale |
|-------|---------|---------------|-------|
| MVP (V1) | In-memory arrays | scikit-learn cosine_similarity | ~10K activities |
| Production (V2) | PostgreSQL + pgvector | SQL vector search | ~100K activities |
| Scale (V3) | Vector DB (FAISS/Qdrant) | Specialized vector index | 1M+ activities |

Each stage requires a different search implementation, but the core business logic (thresholds, scoring, ranking) should remain unchanged.

## Decision

**All similarity search engines must be implemented as adapters behind a Protocol interface.**

```python
from typing import Protocol
from dataclasses import dataclass

@dataclass
class SimilarityResult:
    """Result of a similarity search."""
    activity: str
    score: float
    metadata: dict | None = None

class SimilaritySearchPort(Protocol):
    """Port for similarity search engines."""
    
    def index_embeddings(
        self,
        embeddings: list[list[float]],
        metadata: list[dict]
    ) -> None:
        """Index embeddings with associated metadata."""
        ...
    
    def find_top_k(
        self,
        query_embedding: list[float],
        k: int = 5
    ) -> list[SimilarityResult]:
        """Find top-K most similar embeddings."""
        ...
```

Concrete implementations:
- `InMemorySearchAdapter` (MVP) — scikit-learn cosine_similarity
- `PgVectorSearchAdapter` (V2) — PostgreSQL with pgvector extension
- `FAISSSearchAdapter` (V3) — Facebook AI Similarity Search
- `QdrantSearchAdapter` (V3) — Qdrant vector database

The threshold engine and scoring logic depend only on the `SimilaritySearchPort` interface, never on a specific implementation.

## Consequences

### Positive

- **Scalability**: Transition from MVP to production without rewriting business logic
- **Flexibility**: Test multiple vector databases without code changes
- **SOLID compliance**: Open/Closed Principle (open for extension, closed for modification)
- **Zero-downtime migration**: Run old and new adapters in parallel, gradually shift traffic

### Negative

- **Initial overhead**: Abstraction layer adds slight complexity
- **Interface evolution**: Adding new search features requires updating the Protocol

### Mitigation

The adapter pattern is essential for this use case — the search mechanism *will* change as we scale. The overhead is minimal compared to the cost of rewriting the entire system during migration.

## Implementation Notes

- Use Python's `Protocol` (PEP 544) for structural subtyping
- Configuration should specify which adapter to use (e.g., `SEARCH_ADAPTER=in_memory`)
- All adapters must return results in the same format (`list[SimilarityResult]`)
- Performance benchmarks should be run for each adapter with identical datasets
- During migration, support feature flags to toggle between adapters

## Migration Strategy

When moving from one adapter to another:

1. Implement new adapter alongside old one
2. Add feature flag to config (e.g., `USE_PGVECTOR=true`)
3. Run A/B test with real traffic (measure latency, accuracy)
4. Gradually roll out (10% → 50% → 100%)
5. Deprecate old adapter once new one is stable

This ensures zero-downtime transitions and easy rollback.

## References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Open/Closed Principle](https://en.wikipedia.org/wiki/Open%E2%80%93closed_principle)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)