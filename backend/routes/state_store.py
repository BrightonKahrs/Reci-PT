from fastapi import HTTPException, APIRouter
import logging

from models.response_models import RecipeOutputModel

from state.store import StateStore
from state.local_state_store import LocalStateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/state", tags=["State Endpoints"])

state_store: StateStore= LocalStateStore()


@router.post("/save-recipe")
async def save_recipe(request: RecipeOutputModel) -> dict:
    """Endpoint to save a generated recipe to the state store"""
    
    try:
        # Generate a unique key for the recipe
        recipe_key = f"recipe:{request.recipe.title.lower().replace(' ', '_')}"
        
        # Convert Pydantic model to dict for storage
        recipe_data = request.recipe.model_dump()
        
        # Save to state store
        await state_store.set(recipe_key, recipe_data)
        
        logger.info(f"Saved recipe: {recipe_key}")
        
        return {
            "status": "success",
            "message": f"Recipe '{request.recipe.title}' saved successfully",
            "key": recipe_key
        }
    except Exception as e:
        logger.error(f"Error saving recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to save recipe")