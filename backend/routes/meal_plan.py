from fastapi import HTTPException, APIRouter, Depends
import logging
import uuid

from models.meal_plan import MealPlan
from models.route_endpoints import MealPlanInput
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meal-plan", tags=["Meal Plan Endpoints"])


@router.post("/save")
async def save_meal_plan(request: MealPlanInput, meal_plan_key: str = None, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to save a generated meal plan to the state store
    
    If meal_plan_key is provided, updates the existing meal plan.
    Otherwise uses meal_plan_id from request, or generates a new GUID.
    """
    
    try:
        # Determine the key: provided param > request.meal_plan_id > generate new
        if meal_plan_key:
            key = meal_plan_key
            action = "updated"
        elif request.meal_plan_id:
            key = request.meal_plan_id
            action = "updated"
        else:
            key = f"meal_plan:{uuid.uuid4()}"
            action = "saved"
        
        # Build the full MealPlan with the ID
        meal_plan_data = {
            "meal_plan_id": key,
            "meal_plan_title": request.meal_plan_title,
            "recipe_plan": [slot.model_dump() for slot in request.recipe_plan]
        }
        
        # Save to state store
        await state_store.set(key, meal_plan_data)
        
        logger.info(f"{action.capitalize()} meal plan: {key}")
        
        return {
            "status": "success",
            "message": f"Meal plan {action} successfully",
            "key": key
        }
    except Exception as e:
        logger.error(f"Error saving meal plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to save meal plan")


@router.get("/{meal_plan_key}")
async def get_meal_plan(meal_plan_key: str, state_store: StateStore = Depends(get_state_store)) -> MealPlan:
    """Endpoint to retrieve a saved meal plan from the state store"""
    
    try:
        # Retrieve from state store
        meal_plan_data = await state_store.get(meal_plan_key)
        
        if not meal_plan_data:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        # Validate and return the meal plan
        meal_plan_model = MealPlan.model_validate(meal_plan_data)
        
        logger.info(f"Retrieved meal plan: {meal_plan_key}")
        
        return meal_plan_model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving meal plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve meal plan")
    
    
@router.delete("/{meal_plan_key}")
async def delete_meal_plan(meal_plan_key: str, state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to delete a saved meal plan from the state store"""
    
    try:
        # Delete from state store
        deleted = await state_store.delete(meal_plan_key)
        
        if not deleted:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        logger.info(f"Deleted meal plan: {meal_plan_key}")
        
        return {
            "status": "success",
            "message": f"Meal plan with key '{meal_plan_key}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting meal plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete meal plan")
    

@router.get("/")
async def list_meal_plans(state_store: StateStore = Depends(get_state_store)) -> dict:
    """Endpoint to list all saved meal plans with their full data"""
    
    try:
        # List all meal plan keys
        meal_plan_keys = await state_store.list(prefix="meal_plan:")
        
        # Fetch full data for each meal plan
        meal_plans = []
        for key in meal_plan_keys:
            meal_plan_data = await state_store.get(key)
            if meal_plan_data:
                meal_plans.append({
                    "key": key,
                    "meal_plan": meal_plan_data
                })
        
        logger.info(f"Listed {len(meal_plans)} meal plans")
        
        return {
            "status": "success",
            "meal_plans": meal_plans
        }
    except Exception as e:
        logger.error(f"Error listing meal plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to list meal plans")