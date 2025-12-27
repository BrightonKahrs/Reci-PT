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
async def save_recipe(request: RecipeOutputModel) -> dict:
    """Endpoint to save a generated recipe to the state store"""
    
    try:
        # Generate a unique GUID key for the recipe
        recipe_key = f"recipe:{uuid.uuid4()}"
        
        # Convert Pydantic model to dict for storageS
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