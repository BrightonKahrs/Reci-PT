from pydantic import BaseModel, Field
from models.recipe_models import RecipeField


class RecipeInputModel(BaseModel):
    """Input model for recipe generation"""
    query: str = Field(..., description="User query for recipe generation")

class RecipeOutputModel(BaseModel):
    """Output model for generated recipe"""
    recipe: RecipeField = Field(..., description="Generated recipe")
    