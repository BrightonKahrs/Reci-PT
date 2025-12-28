import logging

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from backend.routes import recipe
from backend.routes import ai
from backend.routes import user_settings
from backend.routes import meal_plan
from backend.routes import grocery_list
from backend.state.store import StateStore
from backend.state.local_store import LocalStateStore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logging.getLogger("azure").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Initialize single state store instance
state_store: StateStore = LocalStateStore()

# Dependency function for state store injection
def get_state_store() -> StateStore:
    return state_store

# Make dependency available to all routes
app = FastAPI(
    title="Recipe AI Backend",
    description="Backend API for Recipe AI with chat capabilities",
    version="1.0.0"
)

# Override the default Depends() to use our get_state_store function
from fastapi import Depends as FastAPIDepends
def Depends(dependency=None):
    if dependency is None:
        return FastAPIDepends(get_state_store)
    return FastAPIDepends(dependency)

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

# Included routers
app.include_router(ai.router)
app.include_router(recipe.router)
app.include_router(user_settings.router)
app.include_router(meal_plan.router)
app.include_router(grocery_list.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
