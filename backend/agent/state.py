from langgraph.graph import MessagesState
from typing import Dict, List
from langchain_core.messages import BaseMessage

class AgentState(MessagesState):
    """agent state variables"""
    user_id: str
    thread_id: str
    turn_id: str
    user_message: str
    messages: List[BaseMessage]


class CasualConversationState(MessagesState):
    """casual conversation state"""
    response: str