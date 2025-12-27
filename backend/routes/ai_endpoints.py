from fastapi import HTTPException, APIRouter
import logging

from ai.agents.recipe_plan_agent import RecipePlanAgent
from ai.agents.recipe_agent import RecipeAgent
from models.response_models import RecipeInputModel, RecipeOutputModel
from models.planner_models import RecipePlanListModel


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Endpoints"])

recipe_plan_agent = RecipePlanAgent()
recipe_agent = RecipeAgent()


@router.post("/generate-recipe", response_model=RecipeOutputModel)
async def generate_recipe(request: RecipeInputModel) -> RecipeOutputModel:
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


@router.post("/generate-recipe-plan", response_model=RecipePlanListModel)
async def generate_recipe_plan(request: RecipeInputModel) -> RecipePlanListModel:
    """Endpoint to generate a recipe plan based on user query"""

    await recipe_plan_agent.start()
    try:
        # Agent returns validated Pydantic model directly
        return await recipe_plan_agent.generate_recipe_plan(user_query=request.query)
    except Exception as e:
        logger.error(f"Error generating recipe plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recipe plan")
    finally:
        await recipe_plan_agent.stop()