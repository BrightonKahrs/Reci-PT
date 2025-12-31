from pydantic import BaseModel, ConfigDict, Field
from typing import List
from models.recipe import Recipe
from models.meal_plan import MealSlot


class RecipeInput(BaseModel):
    """Input model for recipe generation"""
    query: str = Field(..., description="User query for recipe generation")


class RecipeOutput(BaseModel):
    """Output model for generated recipe"""
    recipe: Recipe = Field(..., description="Generated recipe")


class MealPlanInput(BaseModel):
    """Input model for saving meal plans - meal_plan_id is optional"""
    model_config = ConfigDict(extra='forbid')

    meal_plan_id: str | None = None  # Optional - backend generates if not provided
    meal_plan_title: str
    recipe_plan: List[MealSlot]