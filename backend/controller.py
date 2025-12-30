from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from schema import ChatRequest
from agent.builder import agent_service

import uuid
import json

router = APIRouter()

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    Streaming chat endpoint - sends chunks as Server-Sent Events (SSE)
    """
    async def generate():
        try:
            if not request.userId:
                raise HTTPException(status_code=400, detail="User ID is required")
            parent_id = uuid.uuid4()

            
            async for chunk in agent_service({
                "user_id": request.userId,
                "thread_id": request.threadId or uuid.uuid4(),
                "parent_id": uuid.uuid4(),
                "user_message": request.message
            }):
                # Chunks are already in serializable format from agent_service
                # Format as SSE (Server-Sent Events)
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"
                
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable buffering for nginx
        }
    )