from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal

class IngredientField(BaseModel):
    """Represents an ingredient"""
    model_config = ConfigDict(extra='forbid')
    name: str
    quantity: str

class InstructionField(BaseModel):
    """Represents a cooking instruction"""
    model_config = ConfigDict(extra='forbid')
    step_number: int
    description: str

class RecipeField(BaseModel):
    """Represents a recipe"""
    model_config = ConfigDict(extra='forbid')
    title: str
    description: str
    complexity: Literal['Easy', 'Medium', 'Hard']
    dietary_preferences: str
    ingredients: List[IngredientField]
    instructions: List[InstructionField]



