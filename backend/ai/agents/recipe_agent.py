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
        
    async def generate_recipe(self, user_query: str) -> RecipeField:
        """Generates a recipe based on the user's natural language query

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            RecipeField: The validated recipe model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipeAgent not started. Call start() first.")

        agent = self._client.create_agent(
            id="RecipeAgent", 
            system_instructions=system_instructions,
            tools=[],
            response_format=RecipeField
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_query, thread=self._thread)
        logger.info(f"Generated Recipe: {result.text}")
        # Parse the JSON response into Pydantic model
        return RecipeField.model_validate_json(result.text)