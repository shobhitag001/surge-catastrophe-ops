"""
Simulation State Cache for SURGE.
Uses Redis when available, with automatic in-memory fallback.
"""

import json
from typing import Any, Optional
from app.config import settings

_IN_MEMORY_CACHE = {}

try:
    if settings.USE_REDIS:
        import redis
        _redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            decode_responses=True,
            socket_timeout=2.0
        )
        _redis_client.ping()
        REDIS_ACTIVE = True
    else:
        REDIS_ACTIVE = False
except Exception:
    REDIS_ACTIVE = False

def get_cached_state(key: str) -> Optional[Any]:
    if REDIS_ACTIVE:
        try:
            val = _redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception:
            pass
    return _IN_MEMORY_CACHE.get(key)

def set_cached_state(key: str, data: Any, ttl_seconds: int = 3600) -> None:
    if REDIS_ACTIVE:
        try:
            _redis_client.setex(key, ttl_seconds, json.dumps(data))
            return
        except Exception:
            pass
    _IN_MEMORY_CACHE[key] = data
