"""Match endpoint for activity similarity matching."""

from fastapi import APIRouter, Depends

from app.api.schemas.match import MatchRequest, MatchResponse, MatchResultSchema
from app.services.matcher_service import MatcherService

router = APIRouter(prefix="/match", tags=["match"])


def get_matcher_service() -> MatcherService:
    """Dependency to get the matcher service instance.
    
    This will be overridden in main.py to inject the actual service.
    """
    raise NotImplementedError("Matcher service not initialized")


@router.post(
    "",
    response_model=MatchResponse,
    summary="Match activities",
    description="Match user-provided activities against allowed activities using semantic similarity"
)
def match_activities(
    request: MatchRequest,
    matcher_service: MatcherService = Depends(get_matcher_service)
) -> MatchResponse:
    """Match user-provided activities against allowed activities.
    
    Args:
        request: Request containing list of activity descriptions
        matcher_service: Injected matcher service
        
    Returns:
        Match response with results for each input activity
    """
    results = matcher_service.match_activities(request.activities)
    
    return MatchResponse(
        results=[
            MatchResultSchema(
                input=result.input_text,
                matched_activity=result.matched_activity,
                similarity=result.similarity,
                status=result.status
            )
            for result in results
        ]
    )