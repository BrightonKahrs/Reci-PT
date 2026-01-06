from agent_framework import ChatAgent
from azure.identity.aio import DefaultAzureCredential
from agent_framework.azure import AzureAIClient
from agent_framework.devui import serve
from agent_framework import WorkflowBuilder
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List

load_dotenv()

def get_weather(location: str) -> str:
    """Get weather for a location."""
    return f"Weather in {location}: 72F and sunny"

# Test response format models
class JokeResponse(BaseModel):
    """Structured joke response."""
    joke: str
    category: str = "dad_joke"
    rating: int = 5  # 1-10 scale

class RecipeIngredient(BaseModel):
    """Recipe ingredient."""
    name: str
    quantity: float
    unit: str
    description: str = ""

class SimpleRecipe(BaseModel):
    """Simple recipe structure for testing."""
    title: str
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    prep_time_minutes: int = 30

# Debug: Check what environment variables we have
print("=== Environment Variables ===")
azure_ai_endpoint = os.getenv('AZURE_AI_PROJECT_ENDPOINT')
azure_ai_model = os.getenv('AZURE_AI_MODEL_DEPLOYMENT_NAME')
azure_openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
azure_openai_model = os.getenv('AZURE_OPENAI_MODEL_DEPLOYMENT_NAME')

print(f"AZURE_AI_PROJECT_ENDPOINT: {azure_ai_endpoint}")
print(f"AZURE_AI_MODEL_DEPLOYMENT_NAME: {azure_ai_model}")
print(f"AZURE_OPENAI_ENDPOINT: {azure_openai_endpoint}")
print(f"AZURE_OPENAI_MODEL_DEPLOYMENT_NAME: {azure_openai_model}")
print("=== End Debug ===")

# Specify the model explicitly at the client level
model_name = azure_ai_model or azure_openai_model
print(f"Using model: {model_name}")

# Let's also try to extract the actual model name from the endpoint if it exists
if not model_name and azure_openai_endpoint:
    # Sometimes the model is in the endpoint URL
    if "/deployments/" in azure_openai_endpoint:
        try:
            model_from_endpoint = azure_openai_endpoint.split("/deployments/")[1].split("/")[0]
            model_name = model_from_endpoint
            print(f"Extracted model from endpoint: {model_name}")
        except:
            pass

if not model_name:
    print("WARNING: No model name found in environment variables!")
    model_name = "gpt-4"  # fallback
    print(f"Using fallback model: {model_name}")

try:
    # Create client with explicit model specification - try different approaches
    print("Attempting to create AzureAIClient...")
    
    # Try approach 1: model_deployment_name
    try:
        chat_client = AzureAIClient(
            project_endpoint=azure_ai_endpoint,
            model_deployment_name=model_name,
            credential=DefaultAzureCredential()
        )
        print("✓ AzureAIClient created with model_deployment_name")
    except Exception as e1:
        print(f"✗ model_deployment_name failed: {e1}")
        
        # Try approach 2: model
        try:
            chat_client = AzureAIClient(
                project_endpoint=azure_ai_endpoint,
                model=model_name,
                credential=DefaultAzureCredential()
            )
            print("✓ AzureAIClient created with model")
        except Exception as e2:
            print(f"✗ model failed: {e2}")
            
            # Try approach 3: Just endpoint, no model at client level
            try:
                chat_client = AzureAIClient(
                    project_endpoint=azure_ai_endpoint,
                    credential=DefaultAzureCredential()
                )
                print("✓ AzureAIClient created without model (will specify at agent level)")
            except Exception as e3:
                print(f"✗ All client creation attempts failed: {e3}")
                raise
                
except Exception as e:
    print(f"✗ Failed to create any AzureAIClient: {e}")
    raise

# Create agents with different response_format approaches
async def create_and_test_agents():
    """Create agents and test them asynchronously"""
    agents = {}

    # Test 1: Simple agent without response_format
    try:
        agents['simple'] = chat_client.create_agent(
            name="SimpleJokeAgent",
            instructions="You are a friendly dad joke teller. Always respond with a clean, family-friendly dad joke.",
            model=model_name  # Explicitly specify model at agent level
        )
        print("✓ Simple agent created successfully")
        
        # Test the agent execution immediately to catch the "model must be provided" error
        print("Testing simple agent execution...")
        test_thread = agents['simple'].get_new_thread()
        result = await agents['simple'].run("Tell me a dad joke", thread=test_thread)
        print(f"✓ Simple agent execution successful: {result.text[:50]}...")
        
    except Exception as e:
        print(f"✗ Failed to create or test simple agent: {e}")
        agents['simple'] = None

    # Test 2: Agent with JSON instructions (instead of response_format)
    try:
        agents['structured'] = chat_client.create_agent(
            name="StructuredJokeAgent",
            instructions=f"""You are a friendly dad joke teller.
            
            IMPORTANT: Always respond with ONLY valid JSON matching this exact format:
            {JokeResponse.model_json_schema()}
            
            Do not include any other text, explanations, or markdown formatting.
            Return ONLY the JSON object.""",
            model=model_name
            # Remove response_format since it conflicts with agents
        )
        print("✓ Structured agent with JSON instructions created successfully")
        
        # Test execution
        print("Testing structured agent execution...")
        test_thread = agents['structured'].get_new_thread()
        result = await agents['structured'].run("Tell me a dad joke", thread=test_thread)
        print(f"✓ Structured agent execution successful")
        
    except Exception as e:
        print(f"✗ Failed to create structured agent with JSON instructions: {e}")
        agents['structured'] = None

    # Test 3: Agent with JSON response instructions (alternative to response_format)
    try:
        agents['json'] = chat_client.create_agent(
            name="JsonJokeAgent",
            instructions="""You are a friendly dad joke teller. 
            
            IMPORTANT: Always respond with ONLY valid JSON in this exact format:
            {
                "joke": "your dad joke here",
                "category": "dad_joke",
                "rating": 8
            }
            
            Do not include any other text, explanations, or markdown formatting.""",
            model=model_name
        )
        print("✓ JSON agent created successfully")
        
        # Test execution
        print("Testing JSON agent execution...")
        test_thread = agents['json'].get_new_thread()
        result = await agents['json'].run("Tell me a dad joke", thread=test_thread)
        print(f"✓ JSON agent execution successful")
        
    except Exception as e:
        print(f"✗ Failed to create JSON agent: {e}")
        agents['json'] = None

    # Test 4: Recipe agent with JSON instructions (instead of response_format)
    try:
        agents['recipe'] = chat_client.create_agent(
            name="RecipeAgent",
            instructions=f"""You are a recipe generator. Create simple recipes based on user requests.
            
            IMPORTANT: Always respond with ONLY valid JSON matching this exact format:
            {SimpleRecipe.model_json_schema()}
            
            Do not include any other text, explanations, or markdown formatting.
            Return ONLY the JSON object.""",
            model=model_name
            # Remove response_format since it conflicts with agents
        )
        print("✓ Recipe agent with JSON instructions created successfully")
        
        # Test execution
        print("Testing recipe agent execution...")
        test_thread = agents['recipe'].get_new_thread()
        result = await agents['recipe'].run("Give me a simple pasta recipe", thread=test_thread)
        print(f"✓ Recipe agent execution successful")
        
    except Exception as e:
        print(f"✗ Failed to create recipe agent with JSON instructions: {e}")
        agents['recipe'] = None

    return agents

def main(agents):
    print(f"Agent Tests Complete with model: {model_name}")
    print("=== Response Format Test Results ===")
    for agent_type, agent in agents.items():
        if agent:
            print(f"✓ {agent_type.upper()} agent: SUCCESS")
        else:
            print(f"✗ {agent_type.upper()} agent: FAILED")
    print("=== End Test Results ===")
    print()
    print("Available at: http://localhost:8080")
    
    try:
        # Serve all working agents so you can test them
        working_agents = [agent for agent in agents.values() if agent is not None]
        if working_agents:
            serve(entities=working_agents, auto_open=True)
        else:
            print("✗ No working agents to serve!")
    except Exception as e:
        print(f"Error serving: {e}")
        raise

# Make the main function async since we're testing agent execution
import asyncio

async def async_main():
    # Run the agent creation and testing
    agents = await create_and_test_agents()
    
    # Select the first working agent as the main one
    dad_joke_agent = None
    for agent_type, agent in agents.items():
        if agent:
            dad_joke_agent = agent
            print(f"✓ Using {agent_type} agent as main agent")
            break

    if not dad_joke_agent:
        print("✗ No working agent found!")
        raise RuntimeError("Failed to create any working agent")
    
    # Then serve the working ones
    main(agents)

if __name__ == "__main__":
    asyncio.run(async_main())