from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver  

from langgraph.graph import END, START, StateGraph
from agent.nodes import orchestration_node

from agent.state import AgentState
from agent.config import settings

async def _build_agent_graph():
    """build the agent DAG"""
    graph = StateGraph(AgentState)
    graph.add_node("orchestrator", orchestration_node)

    graph.add_edge(START, "orchestrator")
    graph.add_edge("orchestrator", END)
    return graph



async def agent_service(body: dict):
    """Agent service with token-level streaming"""
    async with AsyncPostgresSaver.from_conn_string(settings.pg_uri) as checkpointer:  
        # await checkpointer.setup()
        print(f"conversation: {body['thread_id']}")
        builder = await _build_agent_graph()
        graph = builder.compile(checkpointer=checkpointer)
        config = {
            "configurable": {
                "thread_id": body["thread_id"]
            }
        }
        async for event in graph.astream_events(
            {
                "user_id": body["user_id"],
                "thread_id": body["thread_id"],
                "parent_id": body["parent_id"],
                "user_message": body["user_message"],
            },
            version="v2",
            config=config
        ):
            # Stream LLM tokens as they're generated
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                content = event.get("data", {}).get("chunk", {})
                if hasattr(content, "content") and content.content:
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