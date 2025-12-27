import logging

from agent_framework import AgentThread, ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from backend.models.meal_plan_models import RecipePlanListModel
from typing import Union

logger = logging.getLogger(__name__)

# TODO: add preferences section
preferences= """
    Daily calorie target: 2500cal
    Daily protein target: 180g

    I want to make everything from scratch using whole food ingredients.
    I want meals that are flavorful and diverse
    Prioritize finding creative ways to have synergy between meal's ingredients (for example if im making hamburgers one night, then we could do beef tacos another night to reuse the ground beef)
    I want cook time to be less than an hour per meal
"""


system_instructions = f"""
    You are a Recipe Planner Agent that translates user prompts into an expected recipe plan.

    You MUST honor any dietary preferences specified by the user. 
    Do NOT add more recipes than specifically requested by the user.
    ALWAYS adhere to these preferences supplied by the user:
    {preferences}

    The response MUST be in JSON format matching the RecipePlanListModel schema:
    {RecipePlanListModel.model_json_schema()}

    Example 1:
    User Prompt: I want 3 recipes for a vegetarian dinner on Monday, Wednesday, and Friday for myself and my partner.
    I also want to meal prep lunches for myself for every weekday, the meal prep should be high in protein and nutritionally dense.
    Response:
    {{
        "recipe_plan": [
        {{
            "recipe_title": "zuchinni noodles with pesto",
            "meal_type": "dinner",
            "meal_day": ["monday"]
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
            "meal_day": ["friday"]
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


class RecipePlanAgent(BaseAgent):
    """Agent that specializes in translating natural language to DAX queries."""

    def __init__(self):
        super().__init__(agent_name="RecipePlanAgent")
        
    async def generate_recipe_plan(self, user_query: str) -> RecipePlanListModel:
        """Generates a recipe plan based on the user's natural language query
            If a thread is provided it will be used, otherwise it will generate a new thread.

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            RecipePlanListModel: The validated recipe plan model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipePlanAgent not started. Call start() first.")

        agent = self._client.create_agent(
            id="RecipePlanAgent", 
            system_instructions=system_instructions,
            tools=[],
            response_format=RecipePlanListModel
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_query, thread=self._thread)
        logger.info(f"Generated Recipe Plan: {result.text}")
        # Parse the JSON response into Pydantic model
        return RecipePlanListModel.model_validate_json(result.text)