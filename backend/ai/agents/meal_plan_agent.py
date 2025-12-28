import logging

from agent_framework import AgentThread, ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from backend.models.meal_plan import MealPlan
from state.store import StateStore
from typing import Union

logger = logging.getLogger(__name__)


class MealPlanAgent(BaseAgent):
    """Agent that specializes in generating meal plans."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="MealPlanAgent", state_store=state_store)
        
    async def generate_recipe_plan(self, user_query: str, user_id: str = "default") -> MealPlan:
        """Generates a recipe plan based on the user's natural language query
            If a thread is provided it will be used, otherwise it will generate a new thread.

        Args:
            user_query (str): The natural language query from the user.
            user_id (str): The user ID for looking up preferences (default: "default")
            
        Returns:
            MealPlan: The validated recipe plan model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipePlanAgent not started. Call start() first.")

        # Load user preferences and build system instructions
        preferences = await self._load_user_preferences(user_id)
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
    
    async def _load_user_preferences(self, user_id: str) -> str:
        """Load user preferences from state store"""
        prefs_key = f"user_settings:{user_id}"
        user_settings = await self.state_store.get(prefs_key)
        
        if not user_settings:
            return "No specific dietary preferences set."
        
        return self._format_preferences(user_settings)
    
    def _format_preferences(self, settings: dict) -> str:
        """Format user settings into preference string"""
        user_settings_list = settings.get('user_settings', [])
        
        required = [s['dietary_preference'] for s in user_settings_list 
                   if s.get('order_of_importance') == 'Required']
        preferred = [s['dietary_preference'] for s in user_settings_list 
                    if s.get('order_of_importance') == 'Preferred']
        
        prefs = []
        if required:
            prefs.append(f"REQUIRED dietary restrictions: {', '.join(required)}")
        if preferred:
            prefs.append(f"Preferred dietary preferences: {', '.join(preferred)}")
        
        return '\\n'.join(prefs) if prefs else "No dietary restrictions."
    
    def _build_system_instructions(self, preferences: str) -> str:
        """Build system instructions with user preferences"""
        return f"""
    You are a Recipe Planner Agent that translates user prompts into an expected recipe plan.

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