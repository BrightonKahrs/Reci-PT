from fastapi import HTTPException, APIRouter
import logging

from backend.ai.agents.meal_plan_agent import MealPlanAgent
from ai.agents.recipe_agent import RecipeAgent
from backend.models.response import RecipeInput, RecipeOutput
from backend.models.meal_plan import MealPlan


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Endpoints"])

meal_plan_agent = MealPlanAgent()
recipe_agent = RecipeAgent()


@router.post("/generate-recipe", response_model=RecipeOutput)
async def generate_recipe(request: RecipeInput) -> RecipeOutput:
    """Endpoint to generate a recipe based on user query"""

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


@router.post("/generate-recipe-plan", response_model=MealPlan)
async def generate_recipe_plan(request: RecipeInput) -> MealPlan:
    """Endpoint to generate a recipe plan based on user query"""

    await meal_plan_agent.start()
    try:
        # Agent returns validated Pydantic model directly
        return await meal_plan_agent.generate_recipe_plan(user_query=request.query)
    except Exception as e:
        logger.error(f"Error generating recipe plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recipe plan")
    finally:
        await meal_plan_agent.stop()