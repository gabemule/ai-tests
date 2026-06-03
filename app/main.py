"""Main FastAPI application with startup initialization."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import RedirectResponse

from app.api.routes import match
from app.core.config import settings
from app.embeddings.cache import EmbeddingCache
from app.embeddings.sentence_transformer_adapter import SentenceTransformerAdapter
from app.repositories.allowed_activities import AllowedActivitiesRepository
from app.services.matcher_service import MatcherService
from app.similarity.in_memory_adapter import InMemorySearchAdapter
from app.similarity.thresholds import ThresholdClassifier

# Global service instances
matcher_service: MatcherService | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    global matcher_service

    # Startup: Initialize all services and index embeddings
    print("Starting up...")
    
    # Load allowed activities with variations
    repo = AllowedActivitiesRepository(settings.allowed_activities_path)
    activity_variations = repo.load_activity_variations()
    canonical_names = repo.load_activities()
    print(f"Loaded {len(canonical_names)} activities with {len(activity_variations)} total variations")
    
    # Initialize embedding service
    embedding_service = SentenceTransformerAdapter(settings.embedding_model)
    print(f"Loaded embedding model: {settings.embedding_model}")
    
    # Initialize embedding cache and index all variations
    embedding_cache = EmbeddingCache(embedding_service)
    variations_tuples = [
        (var.canonical_name, var.variation) 
        for var in activity_variations
    ]
    embedding_cache.index_variations(variations_tuples)
    print(f"Indexed embeddings for {len(activity_variations)} variations")
    
    # Initialize similarity search service
    search_service = InMemorySearchAdapter()
    search_service.index_embeddings(
        embedding_cache.get_embeddings(),
        embedding_cache.get_metadata()
    )
    print("Initialized similarity search engine")
    
    # Initialize threshold classifier
    threshold_classifier = ThresholdClassifier(
        approved_threshold=settings.threshold_approved,
        review_min_threshold=settings.threshold_review_min
    )
    
    # Initialize matcher service
    matcher_service = MatcherService(
        embedding_service=embedding_service,
        search_service=search_service,
        threshold_classifier=threshold_classifier
    )
    print("Matcher service initialized")
    
    print("✓ Startup complete")
    
    yield
    
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Semantic similarity engine for activity validation",
    lifespan=lifespan
)


# Include routers
app.include_router(match.router)


# Dependency override for matcher service
def get_matcher_service() -> MatcherService:
    """Get the global matcher service instance."""
    if matcher_service is None:
        raise RuntimeError("Matcher service not initialized")
    return matcher_service


# Override the dependency using FastAPI's dependency_overrides
app.dependency_overrides[match.get_matcher_service] = get_matcher_service


@app.get("/", include_in_schema=False)
def root():
    """Redirect root to API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}