import asyncio
from typing import  Any
import uuid
import logging

from agent_framework import AgentExecutorResponse, WorkflowBuilder, WorkflowContext, executor
from agent_framework.devui import serve

from ai.agents.recipe_agent import RecipeAgent
from ai.agents.macro_budget_reviewer_agent import MacroBudgetReviewerAgent
from ai.agents.meal_plan_agent import MealPlanAgent
from models.meal_plan import MacroBudgetReview, MealPlan
from state.dependencies import get_state_store

state_store = get_state_store()

logger = logging.getLogger(__name__)

async def get_agents():

    agents = {}

    # Recipe Agent
    recipe_agent = RecipeAgent(state_store=state_store)
    await recipe_agent.start()
    recipe_agent = await recipe_agent.create_agent()
    agents["recipe_agent"] = recipe_agent

    # MealPlan Agent
    meal_plan_agent = MealPlanAgent(state_store=state_store)
    await meal_plan_agent.start()
    meal_plan_agent = await meal_plan_agent.create_agent()
    agents["meal_plan_agent"] = meal_plan_agent

    # Macro and Budget Reviewer Agent
    macro_budget_reviewer_agent = MacroBudgetReviewerAgent(state_store=state_store)
    await macro_budget_reviewer_agent.start()
    macro_budget_reviewer_agent = await macro_budget_reviewer_agent.create_agent()
    agents["macro_budget_reviewer_agent"] = macro_budget_reviewer_agent

    return agents

# Condition
def review_failed(message: Any) -> bool:
    """Check if content is approved (high quality)."""
    if not isinstance(message, AgentExecutorResponse):
        return True
    try:
        review = MacroBudgetReview.model_validate_json(message.agent_run_response.text)
        return review.review_status != "Passed"
    except Exception:
        return True
    
@executor(id="defined_macros")
async def defined_macros(message: AgentExecutorResponse, ctx: WorkflowContext[str]) -> None:

    message = message.agent_run_response.text

    logger.info(f"Given Meal Plan: {message}")
    current_meal_plan = MealPlan.model_validate_json(message)

    await ctx.set_shared_state("current_meal_plan", current_meal_plan)

    await ctx.send_message(f"""
        ## Generated Meal Plan
            {message}

        ## USER PROVIDED DAILY TARGETS:
            - 2500 cal
            - 180g protein
            - 200g carbohydrates
            - 100g fats
        """)
    
@executor(id="macro_review_feedback")
async def macro_review_feedback(message: AgentExecutorResponse, ctx: WorkflowContext[str]) -> None:

    message = message.agent_run_response.text

    await ctx.send_message(f"""
                           
        Revise the previously generated meal plan to address the following feedback. We want to ensure all adjustments are accounted for in the new meal plan
                           
        ## Feedback to address
            {message}
        """)
    

@executor(id="finalize_meal_plan")
async def finalize_meal_plan(message: AgentExecutorResponse, ctx: WorkflowContext[str]) -> None:

    meal_plan = await ctx.get_shared_state("current_meal_plan")
    meal_plan = MealPlan.model_validate_json(meal_plan)

    await ctx.send_message(meal_plan.to_json())


async def create_workflow() -> WorkflowBuilder:

    agents = await get_agents()

    workflow = (
        WorkflowBuilder(name="MealPlanWorkflow", max_iterations=20)
        .set_start_executor(agents["meal_plan_agent"])
        .add_edge(agents["meal_plan_agent"], defined_macros)
        .add_edge(defined_macros, agents["macro_budget_reviewer_agent"])

        # Path if review fails
        .add_edge(agents["macro_budget_reviewer_agent"], macro_review_feedback, condition=review_failed)
        .add_edge(macro_review_feedback, agents["meal_plan_agent"])

        # Path if review passes
        .add_edge(agents["macro_budget_reviewer_agent"], finalize_meal_plan, condition=lambda msg: not review_failed(msg))

        .build()
    )

    return workflow


if __name__ == "__main__":
    
    agents = asyncio.run(get_agents())

    meal_plan_agent = agents.get("meal_plan_agent")
    macro_budget_reviewer_agent = agents.get("macro_budget_reviewer_agent")

    workflow = asyncio.run(create_workflow())

    serve(entities=[workflow], auto_open=True)
    # serve(entities=[meal_plan_agent, macro_budget_reviewer_agent], auto_open=True)