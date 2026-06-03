"""Embedding cache for storing pre-computed embeddings in memory."""

from app.embeddings.port import EmbeddingPort


class EmbeddingCache:
    """In-memory cache for activity embeddings.
    
    Embeddings are generated at startup and stored in memory for fast lookup.
    Supports both simple activities and activity variations with metadata.
    """

    def __init__(self, embedding_service: EmbeddingPort):
        """Initialize the cache with an embedding service.
        
        Args:
            embedding_service: Service implementing EmbeddingPort
        """
        self.embedding_service = embedding_service
        self.texts: list[str] = []
        self.embeddings: list[list[float]] = []
        self.metadata: list[dict] = []

    def index_activities(self, activities: list[str]) -> None:
        """Generate and cache embeddings for all activities (legacy method).
        
        Args:
            activities: List of activity strings to index
        """
        self.texts = activities
        self.embeddings = self.embedding_service.encode_batch(activities)
        self.metadata = [{"activity": activity} for activity in activities]

    def index_variations(self, variations: list[tuple[str, str]]) -> None:
        """Generate and cache embeddings for activity variations.
        
        Args:
            variations: List of (canonical_name, variation_text) tuples
        """
        # Extract just the variation texts for embedding
        self.texts = [variation for _, variation in variations]
        
        # Generate embeddings for all variations
        self.embeddings = self.embedding_service.encode_batch(self.texts)
        
        # Store metadata mapping each variation back to its canonical name
        self.metadata = [
            {"activity": canonical_name, "variation": variation}
            for canonical_name, variation in variations
        ]

    def get_embeddings(self) -> list[list[float]]:
        """Get all cached embeddings.
        
        Returns:
            List of embedding vectors
        """
        return self.embeddings

    def get_metadata(self) -> list[dict]:
        """Get metadata for all cached embeddings.
        
        Returns:
            List of metadata dicts
        """
        return self.metadata

    def get_activities(self) -> list[str]:
        """Get all cached activity texts (legacy method).
        
        Returns:
            List of activity/variation strings
        """
        return self.texts

    def get_dimension(self) -> int:
        """Get the embedding dimension.
        
        Returns:
            Embedding dimension
        """
        return self.embedding_service.get_dimension()
