import logging

from agent_framework import ChatMessage

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from models.recipe import Recipe
from state.store import StateStore

logger = logging.getLogger(__name__)

system_instructions= f"""

    You are a Recipe Agent that translates user prompts into recipes.

    ## CRITICAL DIETARY RESTRICTIONS - MUST FOLLOW
    Each user message will include their dietary preferences. You MUST honor them.

    ## STRICT RULES
    1. REQUIRED restrictions are NON-NEGOTIABLE. You MUST NOT include ANY ingredients that violate them.
    2. If a user asks for a dish that traditionally contains forbidden ingredients (e.g., "spaghetti and meatballs" when vegetarian is required), you MUST create a compliant alternative version.
    3. For "vegetarian": NO meat, poultry, fish, or seafood. Use plant-based proteins (beans, lentils, tofu, tempeh, seitan) or meat substitutes.
    4. For "no dairy": NO milk, cheese, butter, cream, yogurt, or any dairy derivatives. Use plant-based alternatives.
    5. ALWAYS adapt the recipe to meet dietary requirements rather than refusing or suggesting non-compliant options.

    ## EXAMPLES OF COMPLIANT SUBSTITUTIONS
    - Meatballs → Use lentil/mushroom/bean-based meatballs
    - Ground beef → Use crumbled tofu, tempeh, or plant-based ground meat
    - Parmesan cheese → Use nutritional yeast or vegan parmesan
    - Milk/cream → Use oat milk, coconut milk, or cashew cream

    ## RESPONSE FORMAT
    Respond ONLY with valid JSON matching this schema:
    {Recipe.model_json_schema()}
    """


class RecipeAgent(BaseAgent):
    """Agent that specializes in translating natural language to recipes."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="RecipeAgent", state_store=state_store)
        self.system_instructions = system_instructions
        
    async def generate_recipe(self, user_query: str) -> Recipe:
        """Generates a recipe based on the user's natural language query

        Args:
            user_query (str): The natural language query from the user.
            
        Returns:
            Recipe: The validated recipe model."""
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("RecipeAgent not started. Call start() first.")

        # Load user preferences to include in the message
        preferences = await self._load_user_preferences()
        
        # Build user message with preferences context
        user_message = self._build_user_message(user_query, preferences)
        logger.info(f"User message with preferences: {user_message}")

        # Create agent with static system instructions (reusable)
        agent = self._client.create_agent(
            id="RecipeAgent", 
            instructions=self.system_instructions,
            tools=[],
            response_format=Recipe
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_message, thread=self._thread)
        logger.info(f"Generated Recipe: {result.text}")
        # Parse the JSON response into Pydantic model
        return Recipe.model_validate_json(result.text)
    
    def _build_user_message(self, user_query: str, preferences: str) -> str:
        """Build user message with preferences context"""

        return f"""
            ## MY DIETARY PREFERENCES
            {preferences}

            ## MY REQUEST
            {user_query}
        """