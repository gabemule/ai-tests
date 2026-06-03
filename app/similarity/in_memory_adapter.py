"""In-memory similarity search adapter using scikit-learn — ADR-002 implementation."""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

from app.similarity.port import SimilarityResult


class InMemorySearchAdapter:
    """In-memory similarity search using cosine similarity.
    
    Implements SimilaritySearchPort protocol for dependency inversion.
    """

    def __init__(self):
        """Initialize the adapter."""
        self.embeddings: np.ndarray | None = None
        self.metadata: list[dict] = []

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
        self.embeddings = np.array(embeddings)
        self.metadata = metadata

    def find_top_k(
        self,
        query_embedding: list[float],
        k: int = 5
    ) -> list[SimilarityResult]:
        """Find top-K most similar embeddings using cosine similarity.
        
        Args:
            query_embedding: Query vector to search for
            k: Number of results to return
            
        Returns:
            List of similarity results, sorted by score (descending)
        """
        if self.embeddings is None:
            return []

        query_vector = np.array(query_embedding).reshape(1, -1)
        similarities = cosine_similarity(query_vector, self.embeddings)[0]

        # Get top-K indices
        top_k_indices = np.argsort(similarities)[::-1][:k]

        results = []
        for idx in top_k_indices:
            results.append(
                SimilarityResult(
                    activity=self.metadata[idx]["activity"],
                    score=float(similarities[idx]),
                    metadata=self.metadata[idx]
                )
            )

        return results