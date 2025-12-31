import logging
import uuid

from ai.ai_config import config
from ai.agents.base_agent import BaseAgent
from models.meal_plan import MealPlan
from state.store import StateStore

logger = logging.getLogger(__name__)

system_instructions = f"""

    You are a Meal Plan Agent that translates user prompts into meal plans.

    ## CRITICAL DIETARY RESTRICTIONS - MUST FOLLOW
    Each user message will include their dietary preferences. You MUST honor them.

    ## STRICT RULES
    1. REQUIRED restrictions are NON-NEGOTIABLE. You MUST NOT include ANY ingredients that violate them.
    2. If a user asks for a dish that traditionally contains forbidden ingredients, you MUST create a compliant alternative version.
    3. For "vegetarian": NO meat, poultry, fish, or seafood. Use plant-based proteins.
    4. For "no dairy": NO milk, cheese, butter, cream, yogurt, or any dairy derivatives.
    5. Do NOT add more recipes than specifically requested by the user.
    6. ALWAYS adapt recipes to meet dietary requirements.
    7. Do NOT include recipe_id - leave it as null (these are draft meal slots).

    ## RESPONSE FORMAT
    Respond ONLY with valid JSON matching this schema:
    {MealPlan.model_json_schema()}

    ## EXAMPLE
    User Request: I want 3 vegetarian dinners for Monday, Wednesday, and Friday,
    also include a meal prep chicken for lunches on workdays

    Response:
    {{
        "meal_plan_title": "Weeknight Dinners + Meal Prep",
        "recipe_plan": [
            {{
                "meal_day": ["Monday"],
                "meal_time": ["Dinner"],
                "title": "Zucchini Noodles with Basil Pesto",
                "dietary_preferences": ["vegetarian"],
                "description": "Light and fresh zucchini noodles tossed in homemade basil pesto",
                "comments": "Can substitute pine nuts with walnuts for nut allergies",
                "number_of_servings": 2,
                "nutritional_info": {{
                    "calories": 400,
                    "protein": 12.0,
                    "fat": 18.0,
                    "carbohydrates": 50.0
                }},
                "complexity": "Easy"
            }},
            {{
                "meal_day": ["Wednesday"],
                "meal_time": ["Dinner"],
                "title": "Quinoa Stuffed Bell Peppers",
                "dietary_preferences": ["vegetarian", "gluten-free"],
                "description": "Colorful bell peppers stuffed with seasoned quinoa and black beans",
                "comments": "Great for meal prep - keeps well in the fridge for 3 days",
                "number_of_servings": 2,
                "nutritional_info": {{
                    "calories": 450,
                    "protein": 15.0,
                    "fat": 14.0,
                    "carbohydrates": 60.0
                }},
                "complexity": "Medium"
            }},
            {{
                "meal_day": ["Friday"],
                "meal_time": ["Dinner"],
                "title": "Mushroom and Spinach Risotto",
                "dietary_preferences": ["vegetarian"],
                "description": "Creamy arborio rice with sautéed mushrooms and fresh spinach",
                "comments": "Use vegetable broth for best flavor",
                "number_of_servings": 2,
                "nutritional_info": {{
                    "calories": 500,
                    "protein": 14.0,
                    "fat": 16.0,
                    "carbohydrates": 70.0
                }},
                "complexity": "Medium"
            }},
            {{
                "meal_day": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "meal_time": ["Lunch"],
                "title": "Meal Prep Chicken and Quinoa Bowls",
                "dietary_preferences": ["high-protein", "gluten-free"],
                "description": "Grilled chicken breast over fluffy quinoa with roasted vegetables",
                "comments": "Prep on Sunday - portion into 5 containers for the week",
                "number_of_servings": 1,
                "nutritional_info": {{
                    "calories": 480,
                    "protein": 35.0,
                    "fat": 12.0,
                    "carbohydrates": 45.0
                }},
                "complexity": "Easy"
            }}
        ]
    }}
"""


class MealPlanAgent(BaseAgent):
    """Agent that specializes in generating meal plans."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="MealPlanAgent", state_store=state_store)
        self.system_instructions = system_instructions
        
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
            instructions=self.system_instructions,
            tools=[],
            response_format=MealPlan
        )

        if not self._thread:
            self._thread = agent.get_new_thread()

        result = await agent.run(user_message, thread=self._thread)
        meal_plan = MealPlan.model_validate_json(result.text)
        meal_plan.meal_plan_id = f"meal_plan:{uuid.uuid4().hex[:8]}"

        return meal_plan
    
    def _build_user_message(self, user_query: str, preferences: str) -> str:
        """Build user message with preferences context"""

        return f"""
            ## MY PREFERENCES
            {preferences}

            ## MY REQUEST
            {user_query}
        """
