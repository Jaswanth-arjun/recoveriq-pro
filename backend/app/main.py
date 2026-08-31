from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging
from app.core.db import engine, Base
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        from sqlalchemy import text
        for col in ["address_line", "city", "pincode", "landmark"]:
            try:
                await conn.execute(text(f"ALTER TABLE customers ADD COLUMN {col} VARCHAR(300) DEFAULT ''"))
            except Exception:
                pass
        for tbl in ["subscriptions", "one_time_orders"]:
            try:
                await conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN items_detail JSON DEFAULT '[]'"))
            except Exception:
                pass
    yield


if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.2)

app = FastAPI(
    title="RecoverIQ Pro",
    description="AI Revenue Recovery Agent — Razorpay TEST MODE. The LLM thinks, code acts.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"app": "RecoverIQ Pro", "docs": "/docs",
            "razorpay": "REAL TEST MODE" if settings.razorpay_ready else "SIMULATED"}
