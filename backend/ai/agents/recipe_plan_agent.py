import logging

from agent_framework import ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from models.planner_models import RecipePlanListModel
from typing import Union

logger = logging.getLogger(__name__)


system_instructions = f"""
    You are a Recipe Planner Agent that translates user prompts into an expected recipe plan.

    You MUST honor any dietary preferences specified by the user. 

    The response MUST be in JSON format matching the RecipePlanListModel schema:
    {RecipePlanListModel.model_json_schema()}

    Example 1:
    User Prompt: I want 3 recipes for a vegetarian dinner on Monday, Wednesday, and Friday.
    Response:
    {{
        "plans": [
        {{
            "recipe_theme": "zuchinni noodles with pesto",
            "meal_type": "dinner",
            "meal_day": "monday"
        }},
        {{
            "recipe_theme": "quinoa salad with roasted vegetables",
            "meal_type": "dinner",
            "meal_day": "wednesday"
        }},
        {{
            "recipe_theme": "stuffed bell peppers with black beans and corn",
            "meal_type": "dinner",
            "meal_day": "friday"
        }}
        ]
    }}

    Example 2:
    User Prompt: I want to meal prep lunches this week and have a unique dinner every night
    Response:
        {{
            "plans": [
             {{
                "recipe_theme": "chicken and quinoa bowel with beans",
                "meal_type": "lunch",
                "meal_day": "monday"
             }},
             {{
                "recipe_theme": "grilled salmon with asparagus",
                "meal_type": "dinner",
                "meal_day": "monday"
             }},
             {{
                "recipe_theme": "chicken and quinoa bowel with beans",
                "meal_type": "lunch",
                "meal_day": "tuesday"
             }},
             {{
                "recipe_theme": "homemade sushi and miso soup",
                "meal_type": "dinner",
                "meal_day": "tuesday"
             }},
             {{
                "recipe_theme": "chicken and quinoa bowel with beans",
                "meal_type": "lunch",
                "meal_day": "wednesday"
             }},
             {{
                "recipe_theme": "chicken stir fry with vegetables and brown rice",
                "meal_type": "dinner",
                "meal_day": "wednesday"
             }},
             {{
                "recipe_theme": "chicken and quinoa bowel with beans",
                "meal_type": "lunch",
                "meal_day": "thursday"
             }},
             {{
                "recipe_theme": "zucchini noodles with beef meat tomato meat sauce",
                "meal_type": "dinner",
                "meal_day": "thursday"
             }},
             {{
                "recipe_theme": "chicken and quinoa bowel with beans",
                "meal_type": "lunch",
                "meal_day": "friday"
             }},
             {{
                "recipe_theme": "homemade burgers with sweet potato fries",
                "meal_type": "dinner",
                "meal_day": "friday"
             }},
            ]
        }}
"""


class RecipePlanAgent(BaseAgent):
    """Agent that specializes in translating natural language to DAX queries."""

    def __init__(self):
        super().__init__(agent_name="RecipePlanAgent")
        
    async def generate_recipe_plan(self, user_query: str) -> RecipePlanListModel:
        """Generates a recipe plan based on the user's natural language query

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            RecipePlanListModel: The validated recipe plan model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipePlanAgent not started. Call start() first.")

        messages = [
            ChatMessage(role="system", text=system_instructions),
            ChatMessage(role="user", text=user_query),
        ]

        agent = self._client.create_agent(
            id="RecipePlanAgent", 
            tools=[], 
            messages=messages,
            response_format=RecipePlanListModel
        )

        result = await agent.run(messages=messages)
        logger.info(f"Generated Recipe Plan: {result.text}")
        # Parse the JSON response into Pydantic model
        return RecipePlanListModel.model_validate_json(result.text)