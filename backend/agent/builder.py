from langgraph.graph import END, START, StateGraph
from agent.nodes import orchestration_node

from agent.state import AgentState


def _build_agent_graph():
    """build the agent DAG"""
    graph = StateGraph(AgentState)
    graph.add_node("orchestrator", orchestration_node)

    graph.add_edge(START, "orchestrator")
    graph.add_edge("orchestrator", END)
    return graph


def build_graph():
    """Build and return the agent workflow graph"""
    # build state graph
    builder = _build_agent_graph()
    return builder.compile()


graph = build_graph()

async def agent_service(body: dict):
    """Agent service with token-level streaming"""
    async for event in graph.astream_events(
        {
            "user_id": body["user_id"],
            "thread_id": body["thread_id"],
            "parent_id": body["parent_id"],
            "user_message": body["user_message"]
        },
        version="v2"
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