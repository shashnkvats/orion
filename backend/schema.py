from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    threadId: Optional[str] = None
    message: str


class RenameThreadRequest(BaseModel):
    title: str
