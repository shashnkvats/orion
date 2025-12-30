from agent.state import AgentState
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

from agent.config import settings

from agent.prompt import orion

llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=settings.temperature,
        api_key=settings.openai_api_key,
        streaming=True
    )


async def orchestration_node(state: AgentState):
    """orchestration node - makes an LLM call and returns the response with streaming"""
    # Initialize LangChain ChatOpenAI with streaming enabled
    existing_messages = state.get("messages", [])

    if not existing_messages:
        messages = [
            (SystemMessage(content=orion.prompt))
        ]
    else:
        messages = existing_messages

    user_message = state.get("user_message", "")    
    messages.append(HumanMessage(content=user_message))
    
    # Stream the response
    full_response = ""
    async for chunk in llm.astream(messages):
        full_response += chunk.content

    messages.append(AIMessage(content=full_response))

    return {
        "messages": messages
    }