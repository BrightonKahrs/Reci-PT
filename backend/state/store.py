from typing import Optional, List
from abc import ABC, abstractmethod

class StateStore(ABC):
    @abstractmethod
    async def get(self, key: str) -> Optional[dict]:
        ...

    @abstractmethod
    async def set(self, key: str, value: dict) -> None:
        ...
    @abstractmethod
    async def delete(self, key: str) -> None:
        ...

    @abstractmethod
    async def list(self, prefix: str) -> List[str]:
        ...