from pydantic import BaseModel, ConfigDict
from typing import List

from backend.models.recipe import Ingredient


class GroceryList(BaseModel):
    """Represents a grocery list"""
    model_config = ConfigDict(extra='forbid')
    items: List[Ingredient]