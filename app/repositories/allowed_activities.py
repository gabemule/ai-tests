"""Repository for managing allowed activities."""

import json
from pathlib import Path


class ActivityVariation:
    """Represents a variation of an activity with its canonical name."""
    
    def __init__(self, canonical_name: str, variation: str):
        """Initialize activity variation.
        
        Args:
            canonical_name: Official activity name
            variation: Variation/synonym of the activity
        """
        self.canonical_name = canonical_name
        self.variation = variation


class AllowedActivitiesRepository:
    """Repository for loading and managing allowed activities."""

    def __init__(self, file_path: str):
        """Initialize the repository.
        
        Args:
            file_path: Path to the JSON file containing allowed activities
        """
        self.file_path = Path(file_path)

    def load_activities(self) -> list[str]:
        """Load allowed activities from JSON file (legacy format).
        
        Returns:
            List of allowed activity strings
            
        Raises:
            FileNotFoundError: If the activities file doesn't exist
            json.JSONDecodeError: If the file is not valid JSON
        """
        if not self.file_path.exists():
            raise FileNotFoundError(f"Activities file not found: {self.file_path}")

        with open(self.file_path, "r", encoding="utf-8") as f:
            activities = json.load(f)

        if isinstance(activities, list):
            # Legacy format: simple list
            return activities
        elif isinstance(activities, dict):
            # New format: dict with variations - return canonical names only
            return list(activities.keys())
        else:
            raise ValueError("Activities file must contain a JSON array or object")

    def load_activity_variations(self) -> list[ActivityVariation]:
        """Load all activity variations with their canonical names.
        
        Supports two formats:
        - Legacy: ["Activity 1", "Activity 2"] → each becomes a single variation
        - New: {"Activity 1": ["var1", "var2"], "Activity 2": "single"} → flattened
        
        Returns:
            List of ActivityVariation objects
            
        Raises:
            FileNotFoundError: If the activities file doesn't exist
            json.JSONDecodeError: If the file is not valid JSON
        """
        if not self.file_path.exists():
            raise FileNotFoundError(f"Activities file not found: {self.file_path}")

        with open(self.file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        variations = []

        if isinstance(data, list):
            # Legacy format: each activity is its own variation
            for activity in data:
                variations.append(ActivityVariation(
                    canonical_name=activity,
                    variation=activity
                ))
        elif isinstance(data, dict):
            # New format: dict with variations
            for canonical_name, value in data.items():
                if isinstance(value, str):
                    # Single variation (string)
                    variations.append(ActivityVariation(
                        canonical_name=canonical_name,
                        variation=value
                    ))
                elif isinstance(value, list):
                    # Multiple variations (array)
                    for variation in value:
                        variations.append(ActivityVariation(
                            canonical_name=canonical_name,
                            variation=variation
                        ))
                else:
                    raise ValueError(
                        f"Activity '{canonical_name}' must have string or array value"
                    )
        else:
            raise ValueError("Activities file must contain a JSON array or object")

        return variations
