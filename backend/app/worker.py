"""
arq worker — REAL delayed retry jobs (e.g. insufficient_funds → retry in 48h).
"""

import json
from datetime import datetime, timedelta, timezone

from arq.connections import RedisSettings
from sqlalchemy import select

from app.core.config import settings
from app.core.db import SessionLocal
from app.models import FailureEvent, AuditLog
from app.agents.pipeline import run_pipeline, mark_recovered, audit


async def startup(ctx):
    pass


async def shutdown(ctx):
    pass


async def schedule_retry(event_id: int, delay_hours: int) -> str | None:
    """Queue a real delayed job in Redis. Returns job id (None if Redis unavailable)."""
    try:
        from arq import create_pool
        pool = await create_pool(RedisSettings.from_dsn(settings.redis_url))
        job = await pool.enqueue_job(
            "process_retry", event_id,
            _defer_by=timedelta(hours=delay_hours),
        )
        await pool.close()
        return job.job_id if job else None
    except Exception:
        return None  # graceful: job runs inline later via batch/manual trigger


async def process_retry(ctx, event_id: int):
    """Executes a scheduled SMART_RETRY through the same real pipeline."""
    async with SessionLocal() as db:
        event = await db.get(FailureEvent, event_id)
        if not event or event.status in ("recovered", "stopped"):
            return
        await audit(db, event_id, "executor", "SCHEDULED_RETRY_FIRED",
                    {"scheduled": True})
        await run_pipeline(db, event, skip_gate=True)


async def process_scheduled_retry_now(ctx, event_id: int):
    """Demo helper: fire a scheduled retry immediately (demo time compression)."""
    async with SessionLocal() as db:
        event = await db.get(FailureEvent, event_id)
        if not event:
            return
        await run_pipeline(db, event, skip_gate=True)


class WorkerSettings:
    functions = [process_retry, process_scheduled_retry_now]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
