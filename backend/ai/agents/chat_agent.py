import logging

from agent_framework import ChatAgent

from ai.agents.base_agent import BaseAgent
from state.store import StateStore

logger = logging.getLogger(__name__)

system_instructions = f"""

    You are a friendly and knowledgeable AI cooking assistant. You can help users with:
                
    - Answering questions about cooking techniques and methods
    - Suggesting ingredient substitutions
    - Explaining how to prepare specific dishes
    - Providing tips for meal planning
    - Discussing nutrition and dietary considerations
    - Recommending cooking equipment and tools
    - Sharing food storage and safety tips

    ## IMPORTANT
    The user's dietary preferences are included in each message. Keep these in mind when:
    - Suggesting ingredient substitutions
    - Recommending dishes or ingredients
    - Discussing meal ideas

    Be conversational, helpful, and encouraging. Keep responses concise but informative.
    If a user asks you to generate a full recipe, let them know they can use the 
    "Generate Recipe" tab for a detailed, formatted recipe.
"""


class ChatAgent(BaseAgent):
    """Agent that specializes in general cooking chat and assistance."""

    def __init__(self, state_store: StateStore):
        super().__init__(agent_name="ChatAgent", state_store=state_store)
        self.system_instructions = system_instructions
        self._agent: ChatAgent = None
        
    async def chat(self, user_message: str) -> str:
        """General chat about cooking, recipes, and ingredients
        
        Args:
            user_message (str): The user's chat message
            
        Returns:
            str: The AI assistant's response
        """
        
        self._ensure_client()
        
        if not self._client:
            raise RuntimeError("ChatAgent not started. Call start() first.")
        
        # Load user preferences to provide context
        preferences = await self._load_user_preferences()
        
        # Build user message with preferences context
        full_message = self._build_user_message(user_message, preferences)
        
        if not self._agent:
            self._agent = await self.create_agent()

        if not self._thread:
            self._thread = self._agent.get_new_thread()

        result = await self._agent.run(full_message, thread=self._thread)
        return result.text
    
    async def create_agent(self) -> ChatAgent:
        """Create and configure the MealPlanAgent."""
        self._ensure_client()
        
        agent = self._client.create_agent(
            name="ChatAgent", 
            instructions=self.system_instructions,
            tools=[],
        )

        return agent
    
    def _build_user_message(self, user_message: str, preferences: str) -> str:
        """Build user message with preferences context"""

        return f"""
        ## ABOUT ME
        {preferences}

        ## MY MESSAGE
        {user_message}
        """
