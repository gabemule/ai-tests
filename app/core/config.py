"""Application configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    app_name: str = "Similarity Score API"
    app_version: str = "0.1.0"
    debug: bool = False

    # Embedding Configuration
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"
    embedding_adapter: str = "sentence_transformer"

    # Similarity Search Configuration
    search_adapter: str = "in_memory"
    top_k_results: int = 5

    # Threshold Configuration
    threshold_approved: float = 0.80
    threshold_review_min: float = 0.65
    threshold_rejected: float = 0.65

    # Data Configuration
    allowed_activities_path: str = "data/allowed_activities.json"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()