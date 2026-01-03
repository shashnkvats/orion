from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse

from schema import ChatRequest
from agent.builder import agent_service
from auth.dependencies import get_current_user
from db.pool import db

import uuid
import json

router = APIRouter()

SCHEMA = "orion"


@router.get("/conversations")
async def get_conversations(
    current_user: dict = Depends(get_current_user),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(28, ge=1, le=100, description="Max records to return")
):
    """
    Fetch conversation threads for a user with pagination.
    Returns threads sorted by most recently updated.
    """
    user_id = current_user["user_id"]
    try:
        async with db.pool.acquire() as conn:
            # Get threads with pagination
            rows = await conn.fetch(f"""
                SELECT 
                    thread_id,
                    user_id,
                    thread_title,
                    created_at,
                    updated_at
                FROM {SCHEMA}.conversation_threads
                WHERE user_id = $1 AND is_deleted = false
                ORDER BY updated_at DESC
                OFFSET $2
                LIMIT $3
            """, uuid.UUID(user_id), offset, limit)
            
            # Get total count for pagination metadata
            total = await conn.fetchval(f"""
                SELECT COUNT(*) 
                FROM {SCHEMA}.conversation_threads
                WHERE user_id = $1 AND is_deleted = false
            """, uuid.UUID(user_id))
            
            threads = [
                {
                    "thread_id": str(row["thread_id"]),
                    "user_id": str(row["user_id"]),
                    "title": row["thread_title"],
                    "created_at": row["created_at"].isoformat(),
                    "updated_at": row["updated_at"].isoformat()
                }
                for row in rows
            ]
            
            return {
                "threads": threads,
                "pagination": {
                    "offset": offset,
                    "limit": limit,
                    "total": total,
                    "has_more": offset + len(threads) < total
                }
            }
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{thread_id}/messages")
async def get_thread_messages(
    thread_id: str,
    current_user: dict = Depends(get_current_user),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Fetch messages for a specific conversation thread.
    """
    user_id = current_user["user_id"]
    try:
        async with db.pool.acquire() as conn:
            # Verify thread belongs to user
            thread = await conn.fetchrow(f"""
                SELECT thread_id FROM {SCHEMA}.conversation_threads
                WHERE thread_id = $1 AND user_id = $2 AND is_deleted = false
            """, uuid.UUID(thread_id), uuid.UUID(user_id))
            
            if not thread:
                raise HTTPException(status_code=404, detail="Thread not found")
            
            # Get messages
            rows = await conn.fetch(f"""
                SELECT 
                    message_id,
                    turn_id,
                    role,
                    message,
                    metadata,
                    created_at
                FROM {SCHEMA}.chat_messages
                WHERE thread_id = $1 AND is_deleted = false
                ORDER BY created_at ASC
                OFFSET $2
                LIMIT $3
            """, uuid.UUID(thread_id), offset, limit)
            
            messages = [
                {
                    "message_id": str(row["message_id"]),
                    "turn_id": str(row["turn_id"]),
                    "role": row["role"],
                    "content": row["message"],
                    "metadata": row["metadata"],
                    "created_at": row["created_at"].isoformat()
                }
                for row in rows
            ]
            
            return {
                "thread_id": thread_id,
                "messages": messages,
                "pagination": {
                    "offset": offset,
                    "limit": limit
                }
            }
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Streaming chat endpoint - sends chunks as Server-Sent Events (SSE)
    """
    async def generate():
        try:
            user_id = current_user["user_id"]
            parent_id = uuid.uuid4()

            
            async for chunk in agent_service({
                "user_id": user_id,
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


