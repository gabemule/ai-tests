"""Pydantic schemas for the match endpoint."""

from pydantic import BaseModel, Field

from app.similarity.thresholds import MatchStatus


class MatchRequest(BaseModel):
    """Request schema for activity matching."""
    
    activities: list[str] = Field(
        ...,
        min_length=1,
        description="List of user-provided activity descriptions",
        examples=[["tirar sangue", "consulta médica"]]
    )


class MatchResultSchema(BaseModel):
    """Schema for a single match result."""
    
    input: str = Field(..., description="Original user input")
    matched_activity: str = Field(..., description="Best matching allowed activity")
    similarity: float = Field(..., ge=0.0, le=1.0, description="Similarity score (0.0 to 1.0)")
    status: MatchStatus = Field(..., description="Match status (approved/review/rejected)")


class MatchResponse(BaseModel):
    """Response schema for activity matching."""
    
    results: list[MatchResultSchema] = Field(..., description="List of match results")