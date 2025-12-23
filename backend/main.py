"""
FastAPI Backend for Power BI Embedded with AI Agent Chat
"""
import os
import logging 
from typing import Optional

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai.agents.recipe_agent import RecipeAgent
from models.response_models import RecipeInputModel, RecipeOutputModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logging.getLogger("azure").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# In-memory conversation history (in production, use a database)
conversation_history = []

app = FastAPI(
    title="Recipe AI Backend",
    description="Backend API for Recipe AI with chat capabilities",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Recipe AI Backend is running",
        "version": "1.0.0"
    }


@app.post("/generate-recipe", response_model=RecipeOutputModel)
async def generate_recipe(request: RecipeInputModel) -> RecipeOutputModel:
    """Endpoint to generate a recipe based on user query"""

    agent = RecipeAgent()
    await agent.start()
    try:
        recipe_json = await agent.generate_recipe(user_query=request.query)
        return {"recipe_json": recipe_json}
    except Exception as e:
        logger.error(f"Error generating recipe: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate recipe")
    finally:
        await agent.stop()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
