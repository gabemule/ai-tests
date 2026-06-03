"""Tests for the match API endpoint."""


def test_match_endpoint_basic(client):
    """Test basic match endpoint functionality."""
    response = client.post(
        "/match",
        json={"activities": ["tirar sangue"]}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert "results" in data
    assert len(data["results"]) == 1
    
    result = data["results"][0]
    assert "input" in result
    assert "matched_activity" in result
    assert "similarity" in result
    assert "status" in result
    
    assert result["input"] == "tirar sangue"
    assert 0.0 <= result["similarity"] <= 1.0


def test_match_endpoint_multiple_activities(client):
    """Test matching multiple activities."""
    response = client.post(
        "/match",
        json={"activities": ["tirar sangue", "consulta médica", "vacinar bebê"]}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["results"]) == 3


def test_match_endpoint_empty_list(client):
    """Test that empty activity list returns 422."""
    response = client.post(
        "/match",
        json={"activities": []}
    )
    
    assert response.status_code == 422


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_redirect(client):
    """Test that root redirects to docs."""
    response = client.get("/", follow_redirects=False)
    
    assert response.status_code == 307
    assert response.headers["location"] == "/docs"