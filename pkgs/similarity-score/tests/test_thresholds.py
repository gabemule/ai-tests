"""Tests for threshold classification logic."""

import pytest

from app.similarity.thresholds import MatchStatus, ThresholdClassifier


def test_threshold_classifier_approved():
    """Test that high scores are classified as approved."""
    classifier = ThresholdClassifier(approved_threshold=0.80, review_min_threshold=0.65)
    
    assert classifier.classify(0.90) == MatchStatus.APPROVED
    assert classifier.classify(0.80) == MatchStatus.APPROVED


def test_threshold_classifier_review():
    """Test that medium scores are classified as review."""
    classifier = ThresholdClassifier(approved_threshold=0.80, review_min_threshold=0.65)
    
    assert classifier.classify(0.75) == MatchStatus.REVIEW
    assert classifier.classify(0.65) == MatchStatus.REVIEW


def test_threshold_classifier_rejected():
    """Test that low scores are classified as rejected."""
    classifier = ThresholdClassifier(approved_threshold=0.80, review_min_threshold=0.65)
    
    assert classifier.classify(0.60) == MatchStatus.REJECTED
    assert classifier.classify(0.30) == MatchStatus.REJECTED
    assert classifier.classify(0.0) == MatchStatus.REJECTED


def test_threshold_classifier_custom_thresholds():
    """Test classifier with custom thresholds."""
    classifier = ThresholdClassifier(approved_threshold=0.90, review_min_threshold=0.70)
    
    assert classifier.classify(0.95) == MatchStatus.APPROVED
    assert classifier.classify(0.80) == MatchStatus.REVIEW
    assert classifier.classify(0.65) == MatchStatus.REJECTED