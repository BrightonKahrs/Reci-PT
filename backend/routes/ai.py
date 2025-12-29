import logging

from fastapi import HTTPException, APIRouter, Depends
from pydantic import BaseModel

from ai.agents.meal_plan_agent import MealPlanAgent
from ai.agents.recipe_agent import RecipeAgent
from models.response import RecipeInput, RecipeOutput
from models.meal_plan import MealPlan
from state.dependencies import get_state_store
from state.store import StateStore


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Endpoints"])

state_store = get_state_store()
recipe_agent = RecipeAgent(state_store=state_store)
meal_plan_agent = MealPlanAgent(state_store=state_store)


class ChatInput(BaseModel):
    message: str


class ChatOutput(BaseModel):
    response: str


@router.post("/chat", response_model=ChatOutput)
async def chat(request: ChatInput) -> ChatOutput:
    """Endpoint for general chat with the AI assistant"""
    
    await recipe_agent.start()
    try:
        # Use the recipe agent for general cooking chat
        response = await recipe_agent.chat(user_message=request.message)
        return ChatOutput(response=response)
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail="Failed to process chat message")
    finally:
        await recipe_agent.stop()


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


@router.post("/generate-meal-plan", response_model=MealPlan)
async def generate_meal_plan(request: RecipeInput) -> MealPlan:
    """Endpoint to generate a meal plan based on user query"""

    await meal_plan_agent.start()
    try:
        # Agent returns validated Pydantic model directly
        return await meal_plan_agent.generate_meal_plan(user_query=request.query)
    except Exception as e:
        logger.error(f"Error generating meal plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate meal plan")
    finally:
        await meal_plan_agent.stop()