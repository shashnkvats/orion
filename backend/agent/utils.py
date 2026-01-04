from agent.prompt.thread_title import prompt
from agent.config import settings
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=settings.temperature,
        api_key=settings.openai_api_key,
        streaming=True
    )

def generate_thread_title(user_message: str) -> str:
    """Generate a title for a conversation thread"""
    system_message = SystemMessage(content=prompt)
    user_message = HumanMessage(content=user_message)
    messages = [system_message, user_message]
    response = llm.invoke(messages)
    return response.content