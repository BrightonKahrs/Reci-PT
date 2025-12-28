from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal

from models.recipe import MacroNutrition


class RecipePlan(BaseModel):
    """Represents a plan for generating a recipe"""
    model_config = ConfigDict(extra='forbid')

    recipe_title: str
    meal_type: Literal['breakfast', 'lunch', 'dinner', 'snack']
    meal_day: List[Literal['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']]
    servings: int = Field(..., description="Number of servings for the recipe")
    estimated_macros: MacroNutrition
    

class MealPlan(BaseModel):
    """Represents a list of recipe plans"""
    model_config = ConfigDict(extra='forbid')
    recipe_plan: List[RecipePlan]