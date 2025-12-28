import logging

from agent_framework import ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from backend.models.recipe import Recipe
from state.store import StateStore

logger = logging.getLogger(__name__)


system_instructions = f"""
    You are a Recipe Agent that translates user prompts into expected recipes

    You MUST honor any dietary preferences specified by the user. 
    Keep all recipes within the specified complexity level.

    The response MUST be in JSON format matching the Recipe schema:
    {Recipe.model_json_schema()}
"""


class RecipeAgent(BaseAgent):
    """Agent that specializes in translating natural language to recipes."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="RecipeAgent", state_store=state_store)
        
    async def generate_recipe(self, user_query: str) -> Recipe:
        """Generates a recipe based on the user's natural language query

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            Recipe: The validated recipe model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipeAgent not started. Call start() first.")

        agent = self._client.create_agent(
            id="RecipeAgent", 
            system_instructions=system_instructions,
            tools=[],
            response_format=Recipe
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_query, thread=self._thread)
        logger.info(f"Generated Recipe: {result.text}")
        # Parse the JSON response into Pydantic model
        return Recipe.model_validate_json(result.text)