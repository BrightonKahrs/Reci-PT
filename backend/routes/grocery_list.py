from fastapi import HTTPException, APIRouter, Depends
import logging
import uuid

from models.grocery_list import GroceryList
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/grocery-list", tags=["Grocery List Endpoints"])


@router.post("/save")
async def save_grocery_list(request: GroceryList, grocery_list_key: str = None, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to save a grocery list to the state store
    
    If grocery_list_key is provided, updates the existing grocery list.
    Otherwise, creates a new grocery list with a generated GUID.
    """
    
    try:
        # Use provided key or generate a new one
        if grocery_list_key:
            key = grocery_list_key
            action = "updated"
        else:
            key = f"grocery_list:{uuid.uuid4()}"
            action = "saved"
        
        # Convert Pydantic model to dict for storage
        grocery_list_data = request.model_dump()
        
        # Save to state store
        await state_store.set(key, grocery_list_data)
        
        logger.info(f"{action.capitalize()} grocery list: {key}")
        
        return {
            "status": "success",
            "message": f"Grocery list {action} successfully",
            "key": key
        }
    except Exception as e:
        logger.error(f"Error saving grocery list: {e}")
        raise HTTPException(status_code=500, detail="Failed to save grocery list")


@router.get("/{grocery_list_key}")
async def get_grocery_list(grocery_list_key: str, state_store: StateStore = Depends(get_state_store)) -> GroceryList:
    """Endpoint to retrieve a saved grocery list from the state store"""
    
    try:
        # Retrieve from state store
        grocery_list_data = await state_store.get(grocery_list_key)
        
        if not grocery_list_data:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        
        # Validate and return the grocery list
        grocery_list_model = GroceryList.model_validate(grocery_list_data)
        
        logger.info(f"Retrieved grocery list: {grocery_list_key}")
        
        return grocery_list_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving grocery list: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve grocery list")
    
    
@router.delete("/{grocery_list_key}")
async def delete_grocery_list(grocery_list_key: str, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to delete a saved grocery list from the state store"""
    
    try:
        # Delete from state store
        deleted = await state_store.delete(grocery_list_key)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Grocery list not found")
        
        logger.info(f"Deleted grocery list: {grocery_list_key}")
        
        return {
            "status": "success",
            "message": f"Grocery list with key '{grocery_list_key}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting grocery list: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete grocery list")
    

@router.get("/")
async def list_grocery_lists(state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to list all saved grocery list keys in the state store"""
    
    try:
        # List all grocery list keys
        grocery_list_keys = await state_store.list(prefix="grocery_list:")
        
        logger.info(f"Listed {len(grocery_list_keys)} grocery lists")
        
        return {
            "status": "success",
            "grocery_list_keys": grocery_list_keys
        }
    except Exception as e:
        logger.error(f"Error listing grocery lists: {e}")
        raise HTTPException(status_code=500, detail="Failed to list grocery lists")