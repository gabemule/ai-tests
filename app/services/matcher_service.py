"""Matcher service that orchestrates the entire similarity matching flow."""

from app.embeddings.port import EmbeddingPort
from app.similarity.port import SimilarityResult, SimilaritySearchPort
from app.similarity.thresholds import MatchStatus, ThresholdClassifier


class MatchResult:
    """Result of a single activity match."""

    def __init__(
        self,
        input_text: str,
        matched_activity: str,
        similarity: float,
        status: MatchStatus
    ):
        """Initialize match result.
        
        Args:
            input_text: Original user input
            matched_activity: Best matching allowed activity
            similarity: Similarity score (0.0 to 1.0)
            status: Classification status (approved/review/rejected)
        """
        self.input_text = input_text
        self.matched_activity = matched_activity
        self.similarity = similarity
        self.status = status


class MatcherService:
    """Service that orchestrates embedding → search → threshold classification."""

    def __init__(
        self,
        embedding_service: EmbeddingPort,
        search_service: SimilaritySearchPort,
        threshold_classifier: ThresholdClassifier
    ):
        """Initialize the matcher service.
        
        Args:
            embedding_service: Service for generating embeddings
            search_service: Service for similarity search
            threshold_classifier: Classifier for threshold logic
        """
        self.embedding_service = embedding_service
        self.search_service = search_service
        self.threshold_classifier = threshold_classifier

    def match_activity(self, input_text: str) -> MatchResult:
        """Match a single user input against allowed activities.
        
        Args:
            input_text: User-provided activity description
            
        Returns:
            Match result with best match and classification
        """
        # Generate embedding for user input
        query_embedding = self.embedding_service.encode(input_text)

        # Find top-1 most similar activity
        results = self.search_service.find_top_k(query_embedding, k=1)

        if not results:
            # No matches found (empty index)
            return MatchResult(
                input_text=input_text,
                matched_activity="",
                similarity=0.0,
                status=MatchStatus.REJECTED
            )

        best_match = results[0]
        status = self.threshold_classifier.classify(best_match.score)

        return MatchResult(
            input_text=input_text,
            matched_activity=best_match.activity,
            similarity=best_match.score,
            status=status
        )

    def match_activities(self, input_texts: list[str]) -> list[MatchResult]:
        """Match multiple user inputs against allowed activities.
        
        Args:
            input_texts: List of user-provided activity descriptions
            
        Returns:
            List of match results
        """
        return [self.match_activity(text) for text in input_texts]