"""Sentence Transformer embedding adapter — ADR-001 implementation."""

from sentence_transformers import SentenceTransformer


class SentenceTransformerAdapter:
    """Adapter for SentenceTransformer embedding models.
    
    Implements EmbeddingPort protocol for dependency inversion.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize the adapter with a specific model.
        
        Args:
            model_name: HuggingFace model identifier
        """
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)

    def encode(self, text: str) -> list[float]:
        """Generate embedding vector for a single text.
        
        Args:
            text: Input text to encode
            
        Returns:
            Embedding vector as list of floats
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def encode_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embedding vectors for multiple texts.
        
        Args:
            texts: List of input texts to encode
            
        Returns:
            List of embedding vectors
        """
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    def get_dimension(self) -> int:
        """Return the dimensionality of the embeddings.
        
        Returns:
            Embedding dimension
        """
        return self.model.get_sentence_embedding_dimension()