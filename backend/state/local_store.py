from typing import Optional, List
from state.store import StateStore

class LocalStateStore(StateStore):
    def __init__(self):
        self.store = {}

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