"""Embedding service port (Protocol) — ADR-001."""

from typing import Protocol


class EmbeddingPort(Protocol):
    """Port for embedding generation services.
    
    This interface allows swapping embedding models without changing
    the core business logic (Dependency Inversion Principle).
    """

    def encode(self, text: str) -> list[float]:
        """Generate embedding vector for a single text.
        
        Args:
            text: Input text to encode
            
        Returns:
            Embedding vector as list of floats
        """
        ...

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for multiple texts.
        
        Args:
            texts: List of input texts to encode
            
        Returns:
            List of embedding vectors
        """
        ...

    def get_dimension(self) -> int:
        """Return the dimensionality of the embeddings.
        
        Returns:
            Embedding dimension (e.g., 384 for all-MiniLM-L6-v2)
        """
        ...