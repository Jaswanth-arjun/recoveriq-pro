from contextlib import asynccontextmanager

try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.db import engine, Base
import app.models
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from sqlalchemy import text
    for col in ["address_line", "city", "pincode", "landmark"]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"ALTER TABLE customers ADD COLUMN IF NOT EXISTS {col} VARCHAR(300) DEFAULT ''"))
        except Exception:
            pass

    for tbl in ["subscriptions", "one_time_orders"]:
        try:
            async with engine.begin() as conn:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS items_detail JSON DEFAULT '[]'"))
        except Exception:
            pass

    # Start background task loop
    async def bg_loop():
        from app.worker import run_all_background_tasks
        while True:
            await asyncio.sleep(15)
            await run_all_background_tasks()

    task = asyncio.create_task(bg_loop())
    yield
    task.cancel()


if settings.sentry_dsn and sentry_sdk:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)

app = FastAPI(
    title="RecoverIQ Pro",
    description="AI Revenue Recovery Agent — Razorpay TEST MODE. The LLM thinks, code acts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"app": "RecoverIQ Pro", "docs": "/docs",
            "razorpay": "REAL TEST MODE" if settings.razorpay_ready else "SIMULATED"}
