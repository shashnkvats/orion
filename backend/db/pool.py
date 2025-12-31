import asyncpg
from typing import Optional
from agent.config import settings


class Database:
    pool: Optional[asyncpg.Pool] = None

db = Database()


async def init_db():
    db.pool = await asyncpg.create_pool(
        user=settings.pg_user,
        password=settings.pg_password,
        database=settings.pg_dbname,
        host=settings.pg_host,
        port=settings.pg_port,
        min_size=5,
        max_size=20,
        command_timeout=60*2,
    )


async def close_db():
    if db.pool:
        await db.pool.close()
