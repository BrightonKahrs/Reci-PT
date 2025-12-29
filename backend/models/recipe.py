from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal


class Ingredient(BaseModel):
    """Represents an ingredient"""
    model_config = ConfigDict(extra='forbid')
    name: str
    quantity: str


class Instruction(BaseModel):
    """Represents a cooking instruction"""
    model_config = ConfigDict(extra='forbid')
    step_number: int
    description: str


class MacroNutrition(BaseModel):
    """Represents nutritional information on a PER serving basis"""
    model_config = ConfigDict(extra='forbid')
    calories: int = Field(..., description="Calories in kcal per serving")
    protein: float = Field(..., description="Protein in grams per serving")
    fat: float = Field(..., description="Fat in grams per serving")
    carbohydrates: float = Field(..., description="Carbohydrates in grams per serving")


class Recipe(BaseModel):
    """Represents a recipe"""
    model_config = ConfigDict(extra='forbid')
    title: str
    description: str
    complexity: Literal['Easy', 'Medium', 'Hard']
    dietary_preferences: str
    ingredients: List[Ingredient]
    instructions: List[Instruction]
    number_of_servings: int
    nutritional_info: MacroNutrition