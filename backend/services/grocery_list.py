from typing import List

from models.meal_plan import MealPlan
from models.grocery_list import GroceryList
from models.recipe import Ingredient, Recipe
from state.store import StateStore


async def get_recipe_by_id(recipe_id: str, state_store: StateStore) -> Recipe:
    """Retrieves a Recipe by its ID from the state store"""
    
    recipe_data = await state_store.get(recipe_id)
    if not recipe_data:
        raise ValueError(f"Recipe with ID {recipe_id} not found")
    
    return Recipe.model_validate(recipe_data)


async def convert_meal_plan_to_grocery_list(meal_plan: MealPlan, state_store: StateStore) -> GroceryList:
    """Converts a MealPlan into a GroceryList by aggregating ingredients"""
    
    ingredients: List[Ingredient] = []
    
    # Need to find all recipe ids from the meal slots
    for meal_slot in meal_plan.recipe_plan:
        # Skip draft recipes that don't have full ingredient data
        if not meal_slot.recipe_id or meal_slot.recipe_id == "recipe:draft":
            continue
            
        try:
            recipe: Recipe = await get_recipe_by_id(meal_slot.recipe_id, state_store)
            ingredients.extend(recipe.ingredients)
        except ValueError:
            # Recipe not found, skip it
            continue
    
    grocery_list = GroceryList(
        grocery_list_id=f"grocery_list:{meal_plan.meal_plan_id.split(':')[1]}",
        meal_plan_id=meal_plan.meal_plan_id,
        items=ingredients
    )
    
    return grocery_list