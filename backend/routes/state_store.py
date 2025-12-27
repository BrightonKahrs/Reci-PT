from fastapi import HTTPException, APIRouter
import logging
import uuid

from models.response_models import RecipeOutputModel

from state.store import StateStore
from state.local_state_store import LocalStateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/state", tags=["State Endpoints"])

state_store: StateStore= LocalStateStore()


@router.post("/save-recipe")
async def save_recipe(request: RecipeOutputModel, recipe_key: str = None) -> dict:
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


@router.get("/get-recipe/{recipe_key}")
async def get_recipe(recipe_key: str) -> RecipeOutputModel:
    """Endpoint to retrieve a saved recipe from the state store"""
    
    try:
        # Retrieve from state store
        recipe_data = await state_store.get(recipe_key)
        
        if not recipe_data:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Wrap in the expected structure
        wrapped_data = {"recipe": recipe_data}
        recipe_model = RecipeOutputModel.model_validate(wrapped_data)
        
        logger.info(f"Retrieved recipe: {recipe_key}")
        
        return recipe_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recipe")
    
    
@router.delete("/delete-recipe/{recipe_key}")
async def delete_recipe(recipe_key: str) -> dict:
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
    

@router.get("/list-recipes")
async def list_recipes() -> dict:
    """Endpoint to list all saved recipe keys in the state store"""
    
    try:
        # List all recipe keys
        recipe_keys = await state_store.list(prefix="recipe:")
        
        logger.info(f"Listed {len(recipe_keys)} recipes")
        
        return {
            "status": "success",
            "recipe_keys": recipe_keys
        }
    except Exception as e:
        logger.error(f"Error listing recipes: {e}")
        raise HTTPException(status_code=500, detail="Failed to list recipes")