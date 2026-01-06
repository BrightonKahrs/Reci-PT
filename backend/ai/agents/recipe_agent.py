import logging
import uuid

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

    ## INGREDIENT FORMAT RULES
    For each ingredient, you MUST provide:
    - `name`: A universal, normalized name (e.g., "chicken breast" not "boneless skinless chicken breast")
    - `quantity`: A numeric value (float) representing the amount
    - `unit`: MUST be one of: "grams", "ml", or "units"
      - Use "grams" for solid ingredients that can be weighed
      - Use "ml" for liquids
      - Use "units" for whole items that don't make sense to measure by weight/volume (e.g., 2 eggs, 1 avocado, 3 tortillas)
    - `description`: Context about preparation or specifics (e.g., "diced", "canned, drained", "ripe", "minced")

    ## INGREDIENT EXAMPLES
    - {{"name": "chicken breast", "quantity": 500, "unit": "grams", "description": "boneless, skinless"}}
    - {{"name": "olive oil", "quantity": 30, "unit": "ml", "description": "extra virgin"}}
    - {{"name": "eggs", "quantity": 3, "unit": "units", "description": "large"}}
    - {{"name": "garlic", "quantity": 2, "unit": "units", "description": "cloves, minced"}}
    - {{"name": "black beans", "quantity": 400, "unit": "grams", "description": "canned, drained"}}

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
            name="RecipeAgent", 
            instructions=self.system_instructions,
            tools=[],
            response_format=Recipe
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_message, thread=self._thread)
        recipe = Recipe.model_validate_json(result.text)
        recipe.recipe_id = f"recipe:{uuid.uuid4().hex[:8]}"

        return recipe
    
    def _build_user_message(self, user_query: str, preferences: str) -> str:
        """Build user message with preferences context"""

        return f"""
            ## MY DIETARY PREFERENCES
            {preferences}

            ## MY REQUEST
            {user_query}
        """
