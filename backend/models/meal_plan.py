from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional

from models.recipe import MacroNutrition


class MealSlot(BaseModel):
    """Represents a meal slot in a meal plan
    Used to map a recipe to a specific day and meal type and hold
    """
    model_config = ConfigDict(extra='forbid')

    # MealSlot specific fields
    day: Literal['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    meal_time: Literal['Breakfast', 'Lunch', 'Snack', 'Dinner']

    # Shared fields from Recipe
    title: str
    dietary_preferences: List[str]
    description: str
    comments: str
    number_of_servings: int
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

    meal_plan_id: str
    meal_plan_title: str
    recipe_plan: List[MealSlot]