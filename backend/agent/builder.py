import uuid

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver  

from langgraph.graph import END, START, StateGraph
from agent.nodes import orchestration_node

from agent.state import AgentState
from agent.config import settings

from persistance.fire_and_forget import fire, persist_thread_and_turn, persist_turn_complete


async def _build_agent_graph():
    """build the agent DAG"""
    graph = StateGraph(AgentState)
    graph.add_node("orchestrator", orchestration_node)

    graph.add_edge(START, "orchestrator")
    graph.add_edge("orchestrator", END)
    return graph



async def agent_service(body: dict):
    """Agent service with token-level streaming"""

    thread_id = body["thread_id"]
    user_id = body["user_id"]
    turn_id = uuid.uuid4()
    user_message = body["user_message"]

    # Fire-and-forget: create thread + turn in single transaction (avoids FK race condition)
    fire(persist_thread_and_turn(thread_id, user_id, turn_id, user_message))

    async with AsyncPostgresSaver.from_conn_string(settings.pg_uri) as checkpointer:  
        # await checkpointer.setup()
        builder = await _build_agent_graph()
        graph = builder.compile(checkpointer=checkpointer)
        config = {
            "configurable": {
                "thread_id": thread_id,
                "ttl": settings.CHECKPOINT_TTL
            }
        }
        
        full_response = ""  # Collect tokens for persistence
        
        async for event in graph.astream_events(
            {
                "user_id": user_id,
                "thread_id": thread_id,
                "turn_id": turn_id,
                "user_message": user_message,
            },
            version="v2",
            config=config
        ):
            # Stream LLM tokens as they're generated
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                content = event.get("data", {}).get("chunk", {})
                if hasattr(content, "content") and content.content:
                    full_response += content.content  # Collect for persistence
                    yield {
                        "type": "token",
                        "content": content.content
                    }
            elif kind == "on_chat_model_end":
                # Signal that streaming is complete
                yield {
                    "type": "end",
                    "content": ""
                }

                # Fire-and-forget: batch persist messages and mark turn complete
                fire(persist_turn_complete(
                    thread_id=thread_id,
                    turn_id=turn_id,
                    user_message=user_message,
                    assistant_message=full_response
                ))