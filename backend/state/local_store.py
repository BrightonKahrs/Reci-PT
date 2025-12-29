import json
import logging
from pathlib import Path
from typing import Optional, List
from state.store import StateStore

logger = logging.getLogger(__name__)

class LocalStateStore(StateStore):
    def __init__(self, load_seed_data: bool = True):
        self.store = {}
        if load_seed_data:
            self._load_seed_data()

    def _load_seed_data(self) -> None:
        """Load initial seed data from JSON file if it exists"""
        seed_file = Path(__file__).parent / "seed_data.json"
        
        if not seed_file.exists():
            logger.info("No seed data file found, starting with empty store")
            return
        
        try:
            with open(seed_file, 'r') as f:
                seed_data = json.load(f)
            
            # Load user settings
            if "user_settings" in seed_data:
                self.store["user_settings"] = seed_data["user_settings"]
                logger.info("Loaded user settings from seed data")
            
            # Load recipes
            if "recipes" in seed_data:
                for key, recipe in seed_data["recipes"].items():
                    self.store[key] = recipe
                logger.info(f"Loaded {len(seed_data['recipes'])} recipes from seed data")
            
            # Load meal plans
            if "meal_plans" in seed_data:
                for key, meal_plan in seed_data["meal_plans"].items():
                    self.store[key] = meal_plan
                logger.info(f"Loaded {len(seed_data['meal_plans'])} meal plans from seed data")
            
            logger.info(f"Seed data loaded successfully. Store contains {len(self.store)} items.")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse seed data JSON: {e}")
        except Exception as e:
            logger.error(f"Failed to load seed data: {e}")

    async def get(self, key: str) -> Optional[dict]:
        return self.store.get(key)

    async def set(self, key: str, value: dict) -> None:
        self.store[key] = value

    async def delete(self, key: str) -> bool:
        if key in self.store:
            del self.store[key]
            return True
        return False

    async def list(self, prefix: str) -> List[str]:
        return [key for key in self.store.keys() if key.startswith(prefix)]