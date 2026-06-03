"""Threshold classification logic for similarity scores."""

from enum import Enum


class MatchStatus(str, Enum):
    """Status of a match based on similarity score."""
    
    APPROVED = "approved"
    REVIEW = "review"
    REJECTED = "rejected"


class ThresholdClassifier:
    """Classifies similarity scores into approval categories."""

    def __init__(
        self,
        approved_threshold: float = 0.80,
        review_min_threshold: float = 0.65
    ):
        """Initialize the classifier with thresholds.
        
        Args:
            approved_threshold: Minimum score for automatic approval (>= 0.80)
            review_min_threshold: Minimum score for manual review (>= 0.65)
        """
        self.approved_threshold = approved_threshold
        self.review_min_threshold = review_min_threshold

    def classify(self, score: float) -> MatchStatus:
        """Classify a similarity score into a status.
        
        Args:
            score: Similarity score (0.0 to 1.0)
            
        Returns:
            Match status (approved, review, or rejected)
        """
        if score >= self.approved_threshold:
            return MatchStatus.APPROVED
        elif score >= self.review_min_threshold:
            return MatchStatus.REVIEW
        else:
            return MatchStatus.REJECTED