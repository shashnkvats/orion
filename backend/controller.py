from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import StreamingResponse
from typing import Optional

from schema import ChatRequest
from agent.builder import agent_service
from auth.dependencies import get_current_user, get_optional_user
from db.pool import db
from agent.config import settings

import uuid
import json

router = APIRouter()

import time


async def check_anonymous_rate_limit(ip_address: str) -> dict:
    """
    Check and increment anonymous user rate limit.
    Returns dict with 'allowed', 'remaining', and 'limit' keys.
    """
    async with db.pool.acquire() as conn:
        # Try to get existing record for today
        row = await conn.fetchrow(f"""
            SELECT request_count FROM {settings.SCHEMA}.anonymous_usage
            WHERE ip_address = $1 AND usage_date = CURRENT_DATE
        """, ip_address)
        
        if row is None:
            # First request today - create record
            await conn.execute(f"""
                INSERT INTO {settings.SCHEMA}.anonymous_usage (ip_address, usage_date, request_count)
                VALUES ($1, CURRENT_DATE, 1)
            """, ip_address)
            return {"allowed": True, "remaining": settings.ANONYMOUS_DAILY_LIMIT - 1, "limit": settings.ANONYMOUS_DAILY_LIMIT}
        
        current_count = row["request_count"]
        
        if current_count >= settings.ANONYMOUS_DAILY_LIMIT:
            # Limit exceeded
            return {"allowed": False, "remaining": 0, "limit": settings.ANONYMOUS_DAILY_LIMIT}
        
        # Increment counter
        await conn.execute(f"""
            UPDATE {settings.SCHEMA}.anonymous_usage
            SET request_count = request_count + 1, updated_at = NOW()
            WHERE ip_address = $1 AND usage_date = CURRENT_DATE
        """, ip_address)
        
        return {"allowed": True, "remaining": settings.ANONYMOUS_DAILY_LIMIT - current_count - 1, "limit": settings.ANONYMOUS_DAILY_LIMIT}


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client IP
    return request.client.host if request.client else "unknown"


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
            start_time = time.time()
            rows = await conn.fetch(f"""
                SELECT 
                    thread_id,
                    user_id,
                    thread_title,
                    created_at,
                    updated_at
                FROM {settings.SCHEMA}.conversation_threads
                WHERE user_id = $1 AND is_deleted = false
                ORDER BY updated_at DESC
                OFFSET $2
                LIMIT $3
            """, uuid.UUID(user_id), offset, limit)
            end_time = time.time()
            print(f"Time taken to fetch threads: {end_time - start_time} seconds")
            # Get total count for pagination metadata
            start_time = time.time()
            total = await conn.fetchval(f"""
                SELECT COUNT(*) 
                FROM {settings.SCHEMA}.conversation_threads
                WHERE user_id = $1 AND is_deleted = false
            """, uuid.UUID(user_id))
            end_time = time.time()
            print(f"Time taken to fetch total count: {end_time - start_time} seconds")
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
            start_time = time.time()
            thread = await conn.fetchrow(f"""
                SELECT thread_id FROM {settings.SCHEMA}.conversation_threads
                WHERE thread_id = $1 AND user_id = $2 AND is_deleted = false
            """, uuid.UUID(thread_id), uuid.UUID(user_id))
            end_time = time.time()
            print(f"Time taken to fetch thread: {end_time - start_time} seconds")
            if not thread:
                raise HTTPException(status_code=404, detail="Thread not found")
            
            # Get messages
            start_time = time.time()
            rows = await conn.fetch(f"""
                SELECT 
                    message_id,
                    turn_id,
                    role,
                    message,
                    metadata,
                    created_at
                FROM {settings.SCHEMA}.chat_messages
                WHERE thread_id = $1 AND is_deleted = false
                ORDER BY created_at ASC
                OFFSET $2
                LIMIT $3
            """, uuid.UUID(thread_id), offset, limit)
            end_time = time.time()
            print(f"Time taken to fetch messages: {end_time - start_time} seconds")
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
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
    current_user: Optional[dict] = Depends(get_optional_user)
):
    """
    Streaming chat endpoint - sends chunks as Server-Sent Events (SSE).
    Works for both authenticated and anonymous users.
    Anonymous users are limited to 5 questions per day.
    """
    is_anonymous = current_user is None
    rate_limit_info = None
    start_time = time.time()
    # Check rate limit for anonymous users
    if is_anonymous:
        client_ip = get_client_ip(request)
        rate_limit_info = await check_anonymous_rate_limit(client_ip)
        
        if not rate_limit_info["allowed"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Daily limit reached. Sign in for unlimited access.",
                    "remaining": 0,
                    "limit": settings.ANONYMOUS_DAILY_LIMIT
                }
            )
    end_time = time.time()
    print(f"Time taken to check rate limit: {end_time - start_time} seconds")
    async def generate():
        try:
            user_id = current_user["user_id"] if current_user else None
            
            async for chunk in agent_service({
                "user_id": user_id,
                "thread_id": chat_request.threadId or str(uuid.uuid4()),
                "parent_id": str(uuid.uuid4()),
                "user_message": chat_request.message,
                "persist": not is_anonymous  # Don't persist for anonymous users
            }):
                # Include rate limit info in first chunk for anonymous users
                if is_anonymous and rate_limit_info and chunk.get("type") == "token":
                    chunk["remaining_questions"] = rate_limit_info["remaining"]
                
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
