from abc import ABC, abstractmethod

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_hypothesis(self, prompt: str) -> dict: 
        pass
