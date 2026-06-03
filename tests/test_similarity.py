"""Tests for similarity search functionality."""

import pytest

from app.similarity.in_memory_adapter import InMemorySearchAdapter
from app.similarity.port import SimilarityResult


def test_in_memory_search_basic():
    """Test basic similarity search functionality."""
    adapter = InMemorySearchAdapter()
    
    # Index some sample embeddings (2D for simplicity)
    embeddings = [
        [1.0, 0.0],
        [0.0, 1.0],
        [0.7, 0.7]
    ]
    metadata = [
        {"activity": "Activity A"},
        {"activity": "Activity B"},
        {"activity": "Activity C"}
    ]
    
    adapter.index_embeddings(embeddings, metadata)
    
    # Search for something close to first embedding
    results = adapter.find_top_k([0.9, 0.1], k=2)
    
    assert len(results) == 2
    assert results[0].activity == "Activity A"
    assert results[0].score > results[1].score


def test_in_memory_search_empty():
    """Test search with no indexed embeddings."""
    adapter = InMemorySearchAdapter()
    
    results = adapter.find_top_k([1.0, 0.0], k=5)
    
    assert results == []


def test_in_memory_search_top_k():
    """Test that top-K returns correct number of results."""
    adapter = InMemorySearchAdapter()
    
    embeddings = [[float(i)] for i in range(10)]
    metadata = [{"activity": f"Activity {i}"} for i in range(10)]
    
    adapter.index_embeddings(embeddings, metadata)
    
    results = adapter.find_top_k([5.0], k=3)
    
    assert len(results) == 3