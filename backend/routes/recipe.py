from fastapi import HTTPException, APIRouter, Depends
import logging
import uuid

from models.response import RecipeOutput
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recipe", tags=["Recipe Endpoints"])


@router.post("/save")
async def save_recipe(request: RecipeOutput, recipe_key: str = None, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to save a generated recipe to the state store
    
    If recipe_key is provided, updates the existing recipe.
    Otherwise, creates a new recipe with a generated GUID.
    """
    
    try:
        # Use provided key or generate a new one
        if recipe_key:
            key = recipe_key
            action = "updated"
        else:
            key = f"recipe:{uuid.uuid4()}"
            action = "saved"
        
        # Convert Pydantic model to dict for storage
        recipe_data = request.recipe.model_dump()
        
        # Save to state store
        await state_store.set(key, recipe_data)
        
        logger.info(f"{action.capitalize()} recipe: {key}")
        
        return {
            "status": "success",
            "message": f"Recipe '{request.recipe.title}' {action} successfully",
            "key": key
        }
    except Exception as e:
        logger.error(f"Error saving recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to save recipe")


@router.get("/{recipe_key}")
async def get_recipe(recipe_key: str, state_store: StateStore = Depends(get_state_store)) -> RecipeOutput:
    """Endpoint to retrieve a saved recipe from the state store"""
    
    try:
        # Retrieve from state store
        recipe_data = await state_store.get(recipe_key)
        
        if not recipe_data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Wrap in the expected structure
        wrapped_data = {"recipe": recipe_data}
        recipe_model = RecipeOutput.model_validate(wrapped_data)
        
        logger.info(f"Retrieved recipe: {recipe_key}")
        
        return recipe_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recipe")
    
    
@router.delete("/{recipe_key}")
async def delete_recipe(recipe_key: str, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to delete a saved recipe from the state store"""
    
    try:
        # Delete from state store
        deleted = await state_store.delete(recipe_key)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        logger.info(f"Deleted recipe: {recipe_key}")
        
        return {
            "status": "success",
            "message": f"Recipe with key '{recipe_key}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete recipe")
    

@router.get("/")
async def list_recipes(state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to list all saved recipes with their full data"""
    
    try:
        # List all recipe keys
        recipe_keys = await state_store.list(prefix="recipe:")
        
        # Fetch full data for each recipe
        recipes = []
        for key in recipe_keys:
            recipe_data = await state_store.get(key)
            if recipe_data:
                recipes.append({
                    "key": key,
                    "recipe": recipe_data
                })
        
        logger.info(f"Listed {len(recipes)} recipes")
        
        return {
            "status": "success",
            "recipes": recipes
        }
    except Exception as e:
        logger.error(f"Error listing recipes: {e}")
        raise HTTPException(status_code=500, detail="Failed to list recipes")