from pydantic import BaseModel, ConfigDict
from typing import List

from models.recipe_models import IngredientField


class GroceryListField(BaseModel):
    """Represents a grocery list"""
    model_config = ConfigDict(extra='forbid')
    items: List[IngredientField]