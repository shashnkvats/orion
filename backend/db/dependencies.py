from db.pool import db

async def get_db_conn():
    async with db.pool.acquire() as connection:
        yield connection
