from fastapi import HTTPException, APIRouter, Depends
import logging

from models.user_settings import UserSettings
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user-settings", tags=["User Settings Endpoints"])

# Single user key - no user_id needed for now
USER_SETTINGS_KEY = "user_settings"


@router.post("/save")
async def save(request: UserSettings, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to save user settings to the state store"""
    
    try:
        # Convert Pydantic model to dict for storage
        settings_data = request.model_dump()
        
        # Save to state store
        await state_store.set(USER_SETTINGS_KEY, settings_data)
        
        logger.info(f"Saved user settings")
        
        return {
            "status": "success",
            "message": "User settings saved successfully"
        }
    except Exception as e:
        logger.error(f"Error saving user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user settings")


@router.get("/")
async def get_user_settings(state_store: StateStore = Depends(get_state_store)) -> UserSettings:
    """Endpoint to retrieve saved user settings from the state store"""
    
    try:
        # Retrieve from state store
        settings_data = await state_store.get(USER_SETTINGS_KEY)
        
        if not settings_data:
            raise HTTPException(status_code=404, detail="User settings not found")
        
        # Validate and return the settings
        settings_model = UserSettings.model_validate(settings_data)
        
        logger.info(f"Retrieved user settings")
        
        return settings_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user settings")
    
    
@router.delete("/")
async def delete_user_settings(state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to delete saved user settings from the state store"""
    
    try:
        # Delete from state store
        deleted = await state_store.delete(USER_SETTINGS_KEY)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="User settings not found")
        
        logger.info(f"Deleted user settings")
        
        return {
            "status": "success",
            "message": "User settings deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user settings")