from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal

from models.recipe_models import MacroNutritionField


class RecipePlanModel(BaseModel):
    """Represents a plan for generating a recipe"""
    model_config = ConfigDict(extra='forbid')

    recipe_title: str = Field(..., description="Title of the recipe")
    meal_type: Literal['breakfast', 'lunch', 'dinner', 'snack']
    meal_day: List[Literal['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']]
    servings: int = Field(..., description="Number of servings for the recipe")
    estimated_macros: MacroNutritionField
    

class RecipePlanListModel(BaseModel):
    """Represents a list of recipe plans"""
    model_config = ConfigDict(extra='forbid')
    recipe_plan: List[RecipePlanModel]