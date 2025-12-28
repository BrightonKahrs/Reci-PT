import logging

from agent_framework import AgentThread, ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from models.meal_plan import MealPlan
from state.store import StateStore
from typing import Union

logger = logging.getLogger(__name__)


class MealPlanAgent(BaseAgent):
    """Agent that specializes in generating meal plans."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="MealPlanAgent", state_store=state_store)
        
    async def generate_meal_plan(self, user_query: str) -> MealPlan:
        """Generates a meal plan based on the user's natural language query
            If a thread is provided it will be used, otherwise it will generate a new thread.

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            MealPlan: The validated recipe plan model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipePlanAgent not started. Call start() first.")

        # Load user preferences and build system instructions
        preferences = await self._load_user_preferences()
        system_instructions = self._build_system_instructions(preferences)

        agent = self._client.create_agent(
            id="RecipePlanAgent", 
            system_instructions=system_instructions,
            tools=[],
            response_format=MealPlan
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_query, thread=self._thread)
        logger.info(f"Generated Recipe Plan: {result.text}")
        # Parse the JSON response into Pydantic model
        return MealPlan.model_validate_json(result.text)
    
    def _build_system_instructions(self, preferences: str) -> str:
        """Build system instructions with user preferences"""
        return f"""
            You are a Meal Plan Agent that translates user prompts into an expected recipe plan.

            User Preferences:
            {preferences}

            You MUST honor any dietary preferences specified by the user.
            Do NOT add more recipes than specifically requested by the user.

            The response MUST be in JSON format matching the MealPlan schema:
            {MealPlan.model_json_schema()}

            Example 1:
            User Prompt: I want 3 recipes for a vegetarian dinner on Monday, Wednesday, and Friday
            
            Model Output (This should be the full, correct JSON):
            {{
                "recipe_plan": [
                {{
                    "recipe_title": "zuchinni noodles with pesto",
                    "meal_type": "dinner",
                    "meal_day": ["monday"],
                    "servings": 2,
                    "estimated_macros": {{
                        "calories": 400,
                        "protein": 12.0,
                        "fat": 18.0,
                        "carbohydrates": 50.0
                    }}
                }},
                {{
                    "recipe_title": "quinoa salad with roasted vegetables",
                    "meal_type": "dinner",
                    "meal_day": ["wednesday"],
                    "servings": 2,
                    "estimated_macros": {{
                        "calories": 450,
                        "protein": 15.0,
                        "fat": 14.0,
                        "carbohydrates": 60.0
                    }}
                }},
                {{
                    "recipe_title": "stuffed bell peppers with black beans and corn",
                    "meal_type": "dinner",
                    "meal_day": ["friday"],
                    "servings": 2,
                    "estimated_macros": {{
                        "calories": 500,
                        "protein": 18.0,
                        "fat": 16.0,
                        "carbohydrates": 70.0
                    }}
                }},
                {{
                    "recipe_title": "chicken and quinoa bowl with beans",
                    "meal_type": "lunch",
                    "meal_day": ["monday", "tuesday", "wednesday", "thursday", "friday"],
                    "servings": 1,
                    "estimated_macros": {{
                        "calories": 600,
                        "protein": 40.0,
                        "fat": 20.0,
                        "carbohydrates": 50.0
                    }}
                }}
                ]
            }}
        """