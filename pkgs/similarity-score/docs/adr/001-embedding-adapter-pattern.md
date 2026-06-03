# ADR 001 — Embedding Adapter Pattern

## Status

Accepted

## Context

The MVP uses `sentence-transformers` with the `all-MiniLM-L6-v2` model to generate embeddings for semantic similarity matching. However, this model is not optimized for Portuguese text, which is the primary language for our use case.

Future iterations will need to test alternative models such as:
- `intfloat/multilingual-e5-base` (better multilingual support)
- `BAAI/bge-m3` (state-of-the-art multilingual embeddings)
- OpenAI's `text-embedding-3-small` (API-based, high quality)

Switching embedding models should not require rewriting the entire application. The embedding generation logic must be isolated from the core business logic.

## Decision

**All embedding services must be implemented as adapters behind a Protocol interface.**

```python
from typing import Protocol

class EmbeddingPort(Protocol):
    """Port for embedding generation services."""
    
    def encode(self, text: str) -> list[float]:
        """Generate embedding vector for a single text."""
        ...
    
    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for multiple texts."""
        ...
    
    def get_dimension(self) -> int:
        """Return the dimensionality of the embeddings."""
        ...
```

Concrete implementations:
- `SentenceTransformerAdapter` (MVP)
- `MultilingualE5Adapter` (future)
- `BGEM3Adapter` (future)
- `OpenAIEmbeddingAdapter` (future)

The rest of the application depends only on the `EmbeddingPort` interface, never on a specific implementation.

## Consequences

### Positive

- **Testability**: Easy to swap models for benchmarking without code changes
- **Flexibility**: Can switch between local and API-based models
- **Maintainability**: Changes to embedding logic are isolated to the adapter
- **SOLID compliance**: Dependency Inversion Principle (depend on abstractions, not concretions)

### Negative

- **Initial overhead**: Slight increase in boilerplate code (Protocol + multiple implementations)
- **Abstraction tax**: One extra layer of indirection

### Mitigation

The benefits far outweigh the minimal overhead. The adapter pattern is a well-established solution for this exact problem.

## Implementation Notes

- Use Python's `Protocol` (PEP 544) for structural subtyping instead of ABCs
- Configuration should specify which adapter to use (e.g., `EMBEDDING_ADAPTER=sentence_transformer`)
- All adapters must be tested with the same validation dataset to ensure consistency
- The embedding dimension must be consistent across adapters (pad/truncate if needed)

## References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Python Protocols](https://peps.python.org/pep-0544/)