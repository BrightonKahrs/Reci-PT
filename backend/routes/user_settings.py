from fastapi import HTTPException, APIRouter, Depends
import logging
import uuid

from backend.models.user_settings import UserSettings
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user-settings", tags=["User Settings Endpoints"])


@router.post("/save")
async def save(request: UserSettings, settings_key: str = None, state_store: StateStore = Depends()) -> dict:
    """Endpoint to save user settings to the state store
    
    If settings_key is provided, updates the existing settings.
    Otherwise, creates new settings with a generated GUID.
    """
    
    try:
        # Use provided key or generate a new one
        if settings_key:
            key = settings_key
            action = "updated"
        else:
            key = f"user_settings:{uuid.uuid4()}"
            action = "saved"
        
        # Convert Pydantic model to dict for storage
        settings_data = request.model_dump()
        
        # Save to state store
        await state_store.set(key, settings_data)
        
        logger.info(f"{action.capitalize()} user settings: {key}")
        
        return {
            "status": "success",
            "message": f"User settings {action} successfully",
            "key": key
        }
    except Exception as e:
        logger.error(f"Error saving user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save user settings")


@router.get("/{settings_key}")
async def get_user_settings(settings_key: str, state_store: StateStore = Depends()) -> UserSettings:
    """Endpoint to retrieve saved user settings from the state store"""
    
    try:
        # Retrieve from state store
        settings_data = await state_store.get(settings_key)
        
        if not settings_data:
            raise HTTPException(status_code=404, detail="User settings not found")
        
        # Validate and return the settings
        settings_model = UserSettings.model_validate(settings_data)
        
        logger.info(f"Retrieved user settings: {settings_key}")
        
        return settings_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user settings")
    
    
@router.delete("/{settings_key}")
async def delete_user_settings(settings_key: str, state_store: StateStore = Depends()) -> dict:
    """Endpoint to delete saved user settings from the state store"""
    
    try:
        # Delete from state store
        deleted = await state_store.delete(settings_key)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="User settings not found")
        
        logger.info(f"Deleted user settings: {settings_key}")
        
        return {
            "status": "success",
            "message": f"User settings with key '{settings_key}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user settings")
    

@router.get("/")
async def list_user_settings(state_store: StateStore = Depends()) -> dict:
    """Endpoint to list all saved user settings keys in the state store"""
    
    try:
        # List all user settings keys
        settings_keys = await state_store.list(prefix="user_settings:")
        
        logger.info(f"Listed {len(settings_keys)} user settings")
        
        return {
            "status": "success",
            "settings_keys": settings_keys
        }
    except Exception as e:
        logger.error(f"Error listing user settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to list user settings")