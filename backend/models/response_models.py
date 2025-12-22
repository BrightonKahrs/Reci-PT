from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal

class RecipeInputModel(BaseModel):
    """Input model for recipe generation"""
    query: str = Field(..., description="User query for recipe generation")

class RecipeOutputModel(BaseModel):
    """Output model for generated recipe"""
    recipe_json: str = Field(..., description="Generated recipe in JSON format")