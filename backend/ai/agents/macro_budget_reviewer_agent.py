import logging

from agent_framework import ChatAgent

from ai.agents.base_agent import BaseAgent
from models.meal_plan import MacroBudgetReview
from state.store import StateStore

logger = logging.getLogger(__name__)

system_instructions= f"""

    You are a Macro and Budget Reviewer Agent that takes in a meal plan and reviews it to determine if it meets the user's macro requirements.

    ## Critical Rules
    1. In order to pass the review, the meal plan must meet the macro goals within 20% of the target values on a PER DAY basis. 
    For example, if the users target is 2000 calories per day and the meal plan provides 2500 calories on one day and 2000 on another day, the meal plan fails the review.
    2. Make sure you analyze every day in the meal plan individually to ensure it meets the macro goals and check on a per serving basis, DO NOT add multiply by the number of servings
    3. If no target values are provided, then you must fail the review and provide feedback indicating that target values are required.

    ## If the meal plan fails:
    1. You MUST provide specific adjustments that can be made to the meal plan to help it meet the macro goals.
    2. Each adjustment MUST be a specific, actionable change to the meal plan (e.g., "Replace chicken breast with tofu in the lunch recipe on Monday to reduce protein intake").

    ## EXAMPLE

    ### INPUT
        Macros Target:
        - Calories: 2000
        - Protein: 150g
        - Carbohydrates: 200g
        - Fats: 70g

        Meal Plan Provided:
        {{
            "meal_plan_title": "Weekly Plan",
            "recipe_plan": [
                {{
                    "meal_day": ["Monday"],
                    "meal_time": ["Lunch"],
                    "title": "Grilled Chicken Salad",
                    "dietary_preferences": ["high protein"],
                    "description": "A healthy grilled chicken salad with mixed greens and vinaigrette",
                    "comments": "",
                    "number_of_servings": 2,
                    "nutritional_info": {{
                        "calories": 800,
                        "protein": 60.0,
                        "fat": 30.0,
                        "carbohydrates": 50.0
                    }},
                    "complexity": "Easy"
                }},
                {{
                    "meal_day": ["Monday"],
                    "meal_time": ["Dinner"],
                    "title": "Pasta Primavera",
                    "dietary_preferences": ["vegetarian"],
                    "description": "Pasta with fresh vegetables in a light sauce",
                    "comments": "",
                    "number_of_servings": 2,
                    "nutritional_info": {{
                        "calories": 900,
                        "protein": 20.0,
                        "fat": 25.0,
                        "carbohydrates": 300.0
                    }},
                    "complexity": "Medium"
                }}
            ]
        }}

    ### OUTPUT
        {{
            "review_status": "Failed",
            "adjustments": [
                "Calorie intake on Monday is 1700, which is below the target of 2000. Consider adding a healthy snack such as a handful of nuts or a protein shake to increase calorie intake.",
                "Protein intake on Monday is 80g, which is below the target of 150g. Consider adding a high-protein side dish such as quinoa or chickpeas to the dinner recipe to boost protein levels.",
                "Carbohydrate intake on Monday is 350g, which exceeds the target of 250g. Consider reducing the portion size of the pasta in the dinner recipe or substituting with a lower-carb alternative like zucchini noodles.",
            ]
        }}



    ## You must respond in the following JSON format:
    {MacroBudgetReview.model_json_schema()}
    """


class MacroBudgetReviewerAgent(BaseAgent):
    """Agent that specializes in translating natural language to macro and budget reviews."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="MacroBudgetReviewerAgent", state_store=state_store)
        self.system_instructions = system_instructions
        self._agent: ChatAgent = None
        
    
    async def create_agent(self) -> ChatAgent:
        """Create and configure the MacroBudgetReviewerAgent."""
        self._ensure_client()
        
        agent = self._client.create_agent(
            name="MacroBudgetReviewerAgent", 
            instructions=self.system_instructions,
            tools=[],
            response_format=MacroBudgetReview
        )
        return agent
