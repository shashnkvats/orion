import asyncio
import uuid
import json
from datetime import datetime
from typing import Optional
from db.pool import db

from agent.utils import generate_thread_title

# Schema where tables are located
SCHEMA = "orion"


async def persist_thread(thread_id: uuid.UUID, user_id: uuid.UUID, title: Optional[str] = None):
    """Fire-and-forget: Create or update a conversation thread"""
    try:
        async with db.pool.acquire() as conn:
            await conn.execute(f"""
                INSERT INTO {SCHEMA}.conversation_threads (thread_id, user_id, thread_title)
                VALUES ($1, $2, $3)
                ON CONFLICT (thread_id) DO UPDATE SET updated_at = now()
            """, thread_id, user_id, title)
    except Exception as e:
        # Log but don't raise - this is fire-and-forget
        print(f"[persist_thread] Error: {e}")


async def persist_turn(thread_id: uuid.UUID, turn_id: uuid.UUID, user_message: str, status: str = "running"):
    """Fire-and-forget: Create a conversation turn"""
    try:
        async with db.pool.acquire() as conn:
            await conn.execute(f"""
                INSERT INTO {SCHEMA}.conversation_turns (turn_id, thread_id, user_message, status)
                VALUES ($1, $2, $3, $4)
            """, turn_id, thread_id, user_message, status)
    except Exception as e:
        print(f"[persist_turn] Error: {e}")


async def persist_thread_and_turn(
    thread_id: uuid.UUID,
    user_id: uuid.UUID,
    turn_id: uuid.UUID,
    user_message: str,
    thread_title: Optional[str] = None
):
    """
    Fire-and-forget: Create/update thread AND create turn in a single transaction.
    This avoids the race condition where turn insert fails because thread doesn't exist yet.
    """
    try:
        thread_title = generate_thread_title(user_message)
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                # First: ensure thread exists (upsert)
                await conn.execute(f"""
                    INSERT INTO {SCHEMA}.conversation_threads (thread_id, user_id, thread_title)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (thread_id) DO UPDATE SET updated_at = now()
                """, thread_id, user_id, thread_title)
                
                # Second: create the turn (thread now guaranteed to exist)
                await conn.execute(f"""
                    INSERT INTO {SCHEMA}.conversation_turns (turn_id, thread_id, user_message, status)
                    VALUES ($1, $2, $3, 'running')
                """, turn_id, thread_id, user_message)
    except Exception as e:
        print(f"[persist_thread_and_turn] Error: {e}")


async def update_turn_status(turn_id: uuid.UUID, status: str):
    """Fire-and-forget: Update turn status (completed/failed)"""
    try:
        async with db.pool.acquire() as conn:
            await conn.execute(f"""
                UPDATE {SCHEMA}.conversation_turns SET status = $2 WHERE turn_id = $1
            """, turn_id, status)
    except Exception as e:
        print(f"[update_turn_status] Error: {e}")


async def persist_message(
    thread_id: uuid.UUID,
    turn_id: uuid.UUID,
    role: str,
    message: str,
    metadata: Optional[dict] = None
):
    """Fire-and-forget: Save a chat message"""
    try:
        message_id = uuid.uuid4()
        async with db.pool.acquire() as conn:
            await conn.execute(f"""
                INSERT INTO {SCHEMA}.chat_messages (message_id, thread_id, turn_id, role, message, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, message_id, thread_id, turn_id, role, message, json.dumps(metadata) if metadata else None)
    except Exception as e:
        print(f"[persist_message] Error: {e}")


async def persist_turn_complete(
    thread_id: uuid.UUID,
    turn_id: uuid.UUID,
    user_message: str,
    assistant_message: str,
    metadata: Optional[dict] = None
):
    """Fire-and-forget: Batch persist user message, assistant message, and mark turn complete"""
    try:
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                # Save user message
                await conn.execute(f"""
                    INSERT INTO {SCHEMA}.chat_messages (message_id, thread_id, turn_id, role, message)
                    VALUES ($1, $2, $3, 'user', $4)
                """, uuid.uuid4(), thread_id, turn_id, user_message)
                
                # Save assistant message
                await conn.execute(f"""
                    INSERT INTO {SCHEMA}.chat_messages (message_id, thread_id, turn_id, role, message, metadata)
                    VALUES ($1, $2, $3, 'assistant', $4, $5)
                """, uuid.uuid4(), thread_id, turn_id, assistant_message, 
                    json.dumps(metadata) if metadata else None)
                
                # Mark turn as completed
                await conn.execute(f"""
                    UPDATE {SCHEMA}.conversation_turns SET status = 'completed' WHERE turn_id = $1
                """, turn_id)
                
                # Update thread timestamp
                await conn.execute(f"""
                    UPDATE {SCHEMA}.conversation_threads SET updated_at = now() WHERE thread_id = $1
                """, thread_id)
    except Exception as e:
        print(f"[persist_turn_complete] Error: {e}")


# Helper to fire tasks without awaiting
def fire(coro):
    """Schedule a coroutine to run in the background (fire-and-forget)"""
    asyncio.create_task(coro)
