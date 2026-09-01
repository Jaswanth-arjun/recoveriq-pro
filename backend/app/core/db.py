import socket
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

db_url = settings.database_url

# If the database URL points to container host 'db', check if host is resolvable.
# If not (e.g. running outside Docker), fall back to SQLite.
if "@db:" in db_url or "@db/" in db_url:
    try:
        socket.gethostbyname("db")
    except Exception:
        db_url = "sqlite+aiosqlite:///./recoveriq.db"

try:
    engine = create_async_engine(db_url, echo=False)
except Exception:
    db_url = "sqlite+aiosqlite:///./recoveriq.db"
    engine = create_async_engine(db_url, echo=False)

SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session
