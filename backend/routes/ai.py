from fastapi import HTTPException, APIRouter, Depends
import logging

from ai.agents.meal_plan_agent import MealPlanAgent
from ai.agents.recipe_agent import RecipeAgent
from models.response import RecipeInput, RecipeOutput
from models.meal_plan import MealPlan
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Endpoints"])


@router.post("/generate-recipe", response_model=RecipeOutput)
async def generate_recipe(request: RecipeInput, state_store: StateStore = Depends(get_state_store)) -> RecipeOutput:
    """Endpoint to generate a recipe based on user query"""

    recipe_agent = RecipeAgent(state_store=state_store)
    await recipe_agent.start()
    try:
        # Agent returns validated Pydantic model directly
        recipe = await recipe_agent.generate_recipe(user_query=request.query)
        return {"recipe": recipe}
    except Exception as e:
        logger.error(f"Error generating recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recipe")
    finally:
        await recipe_agent.stop()


@router.post("/generate-meal-plan", response_model=MealPlan)
async def generate_meal_plan(request: RecipeInput, state_store: StateStore = Depends(get_state_store)) -> MealPlan:
    """Endpoint to generate a meal plan based on user query"""

    meal_plan_agent = MealPlanAgent(state_store=state_store)
    await meal_plan_agent.start()
    try:
        # Agent returns validated Pydantic model directly
        return await meal_plan_agent.generate_meal_plan(user_query=request.query)
    except Exception as e:
        logger.error(f"Error generating meal plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate meal plan")
    finally:
        await meal_plan_agent.stop()