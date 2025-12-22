import logging

from agent_framework import ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from models.recipe_models import RecipeField

logger = logging.getLogger(__name__)


system_instructions = f"""
    You are a Recipe Agent that translates user prompts into expected recipes

    You MUST honor any dietary preferences specified by the user. 
    Keep all recipes within the specified complexity level.

    The response MUST be in JSON format matching the RecipeField schema:
    {RecipeField.model_json_schema()}
"""


class RecipeAgent(BaseAgent):
    """Agent that specializes in translating natural language to DAX queries."""

    def __init__(self):
        super().__init__(agent_name="RecipeAgent")
        
    async def generate_recipe(self, user_query: str) -> str:
        """Generates a recipe based on the user's natural language query

        Args:
            user_query (str): The natural language query from the user."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipeAgent not started. Call start() first.")

        messages = [
            ChatMessage(role="system", text=system_instructions),
            ChatMessage(role="user", text=user_query),
        ]

        agent = self._client.create_agent(
            id="RecipeAgent", 
            tools=[], 
            messages=messages,
            response_format=RecipeField
        )

        result = await agent.run(messages=messages)
        logger.info(f"Generated Recipe: {result.text}")
        return result.text