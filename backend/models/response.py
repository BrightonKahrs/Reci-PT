from pydantic import BaseModel, Field
from models.recipe import Recipe


class RecipeInput(BaseModel):
    """Input model for recipe generation"""
    query: str = Field(..., description="User query for recipe generation")


class RecipeOutput(BaseModel):
    """Output model for generated recipe"""
    recipe: Recipe = Field(..., description="Generated recipe")