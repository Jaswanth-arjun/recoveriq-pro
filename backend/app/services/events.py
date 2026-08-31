import asyncio, json
from fastapi import WebSocket

_connections: set[WebSocket] = set()
_lock = asyncio.Lock()


async def connect(ws: WebSocket):
    await ws.accept()
    async with _lock:
        _connections.add(ws)


async def disconnect(ws: WebSocket):
    async with _lock:
        _connections.discard(ws)


async def broadcast(event_type: str, payload: dict):
    """Push live events to all dashboard clients (within seconds of webhook)."""
    message = json.dumps({"type": event_type, "payload": payload}, default=str)
    async with _lock:
        dead = []
        for ws in _connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            _connections.discard(ws)
