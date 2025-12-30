from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    userId: str
    threadId: Optional[str] = None
    message: str
