"""Similarity search port (Protocol) — ADR-002."""

from dataclasses import dataclass
from typing import Protocol


@dataclass
class SimilarityResult:
    """Result of a similarity search."""
    
    activity: str
    score: float
    metadata: dict | None = None


class SimilaritySearchPort(Protocol):
    """Port for similarity search engines.
    
    This interface allows swapping search implementations without changing
    the core business logic (Open/Closed Principle).
    """

    def index_embeddings(
        self,
        embeddings: list[list[float]],
        metadata: list[dict]
    ) -> None:
        """Index embeddings with associated metadata.
        
        Args:
            embeddings: List of embedding vectors to index
            metadata: Metadata for each embedding (e.g., activity name)
        """
        ...

    def find_top_k(
        self,
        query_embedding: list[float],
        k: int = 5
    ) -> list[SimilarityResult]:
        """Find top-K most similar embeddings.
        
        Args:
            query_embedding: Query vector to search for
            k: Number of results to return
            
        Returns:
            List of similarity results, sorted by score (descending)
        """
        ...