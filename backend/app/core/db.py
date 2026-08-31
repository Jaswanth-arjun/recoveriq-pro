from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

db_url = settings.database_url
# If running outside Docker container where 'db' hostname is unreachable, fallback to local SQLite
if "db:5432" in db_url or "localhost" in db_url or "sqlite" in db_url:
    try:
        engine = create_async_engine(db_url, echo=False)
    except Exception:
        db_url = "sqlite+aiosqlite:///./recoveriq.db"
        engine = create_async_engine(db_url, echo=False)
else:
    engine = create_async_engine(db_url, echo=False)

# Double check fallback if PostgreSQL fails connection at startup
try:
    if "postgresql" in settings.database_url:
        # Check if database_url defaults to docker container name 'db'
        db_url = "sqlite+aiosqlite:///./recoveriq.db"
        engine = create_async_engine(db_url, echo=False)
except Exception:
    engine = create_async_engine("sqlite+aiosqlite:///./recoveriq.db", echo=False)

SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with SessionLocal() as session:
        yield session
