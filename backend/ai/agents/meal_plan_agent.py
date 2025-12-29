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
            raise RuntimeError("MealPlanAgent not started. Call start() first.")

        # Load user preferences to include in the message
        preferences = await self._load_user_preferences()
        
        # Build user message with preferences context
        user_message = self._build_user_message(user_query, preferences)
        logger.info(f"User message with preferences: {user_message}")

        # Create agent with static system instructions (reusable)
        agent = self._client.create_agent(
            id="MealPlanAgent", 
            instructions=self._build_system_instructions(),
            tools=[],
            response_format=MealPlan
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_message, thread=self._thread)
        logger.info(f"Generated Meal Plan: {result.text}")
        # Parse the JSON response into Pydantic model
        return MealPlan.model_validate_json(result.text)
    
    def _build_user_message(self, user_query: str, preferences: str) -> str:
        """Build user message with preferences context"""
        
        return f"""## MY PREFERENCES
            {preferences}

            ## MY REQUEST
            {user_query}"""

    def _build_system_instructions(self) -> str:
        """Build static system instructions"""

        return f"""You are a Meal Plan Agent that translates user prompts into meal plans.

            ## CRITICAL DIETARY RESTRICTIONS - MUST FOLLOW
            Each user message will include their dietary preferences. You MUST honor them.

            ## STRICT RULES
            1. REQUIRED restrictions are NON-NEGOTIABLE. You MUST NOT include ANY ingredients that violate them.
            2. If a user asks for a dish that traditionally contains forbidden ingredients, you MUST create a compliant alternative version.
            3. For "vegetarian": NO meat, poultry, fish, or seafood. Use plant-based proteins.
            4. For "no dairy": NO milk, cheese, butter, cream, yogurt, or any dairy derivatives.
            5. Do NOT add more recipes than specifically requested by the user.
            6. ALWAYS adapt recipes to meet dietary requirements.

            ## RESPONSE FORMAT
            Respond ONLY with valid JSON matching this schema:
            {MealPlan.model_json_schema()}

            ## EXAMPLE
            User Request: I want 3 recipes for a vegetarian dinner on Monday, Wednesday, and Friday

            Response:
            {{
                "recipe_plan": [
                    {{
                        "recipe_title": "zucchini noodles with pesto",
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
                        "recipe_title": "stuffed bell peppers with black beans",
                        "meal_type": "dinner",
                        "meal_day": ["friday"],
                        "servings": 2,
                        "estimated_macros": {{
                            "calories": 500,
                            "protein": 18.0,
                            "fat": 16.0,
                            "carbohydrates": 70.0
                        }}
                    }}
                ]
            }}
            """