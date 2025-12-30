from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional


class Ingredient(BaseModel):
    """Represents an ingredient"""
    model_config = ConfigDict(extra='forbid')

    name: str = Field(..., description="Name of the ingredient as it will be displayed on the recipe, try to be as universal to the ingredient as possible (for example instead of boneless skinless chicken breast just use chicken breast)")
    quantity: float
    unit: Literal['grams', 'ml', 'units'] = Field(..., description="Unit of measurement for the ingredient quantity, if an ingredient is a whole thing and does not make sense to put into grams or ml then use units (for example 7 tortillas would be units)")
    description: str = Field(..., description="Provides recipe context to the name of the ingreident that tries to be more universal, for example 'diced', 'shredded', 'ripe', etc.")

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

    recipe_id: str = Field(..., description="AI generates recipe:draft, system overrides with recipe:uuid")
    title: str
    dietary_preferences: List[str]
    description: str
    comments: str
    number_of_servings: int
    nutritional_info: MacroNutrition
    complexity: Literal['Easy', 'Medium', 'Hard']

    ingredients: List[Ingredient]
    instructions: List[Instruction]
