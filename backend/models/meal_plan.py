from pydantic import BaseModel, ConfigDict, Field
from typing import List, Literal, Optional

from models.recipe import MacroNutrition


class MealSlot(BaseModel):
    """Represents a meal slot in a meal plan
    Used to map a recipe to a specific day and meal type and hold
    """
    model_config = ConfigDict(extra='forbid')

    # MealSlot specific fields - lists to allow same recipe on multiple days/times
    meal_day: List[Literal['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']]
    meal_time: List[Literal['Breakfast', 'Lunch', 'Snack', 'Dinner']]

    # Shared fields from Recipe
    title: str
    dietary_preferences: List[str]
    description: str
    comments: str
    number_of_servings: int = Field(..., description="Number of servings per meal_day and meal_time combination, for example one meal Mon-Fri should be 1")
    nutritional_info: MacroNutrition
    complexity: Literal['Easy', 'Medium', 'Hard']

    # Link to recipe_id when MealSlot is upgraded to a full recipe
    recipe_id: Optional[str] = None

    @property
    def is_draft(self) -> bool:
        return self.recipe_id is None

class MealPlan(BaseModel):
    """Represents a list of recipe plans"""
    model_config = ConfigDict(extra='forbid')

    # Should be created by system, not AI
    meal_plan_id: Optional[str] = None
    meal_plan_title: str
    recipe_plan: List[MealSlot]