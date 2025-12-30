from pydantic import BaseModel, ConfigDict
from typing import List

from models.recipe import Ingredient


class GroceryList(BaseModel):
    """Represents a grocery list"""
    model_config = ConfigDict(extra='forbid')
    
    grocery_list_id: str
    meal_plan_id: str
    items: List[Ingredient]