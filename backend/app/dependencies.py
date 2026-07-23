"""
DermaScreen — Dependencies
FastAPI dependency injection for authentication.
"""

import time
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import firebase_service, supabase_service

security = HTTPBearer(auto_error=False)

# ★ In-memory user cache: { firebase_uid: (user_dict, timestamp) }
_user_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 300  # 5 minutes


def _get_cached_user(firebase_uid: str) -> dict | None:
    """Return cached user if still valid, otherwise None."""
    entry = _user_cache.get(firebase_uid)
    if entry and (time.time() - entry[1]) < _CACHE_TTL:
        return entry[0]
    return None


def _set_cached_user(firebase_uid: str, user_data: dict):
    """Cache a user lookup result."""
    _user_cache[firebase_uid] = (user_data, time.time())


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency that extracts and verifies the Firebase ID token from the
    Authorization header. Returns user info dict with uid, email, name.
    Uses in-memory cache to avoid hitting Supabase on every request.
    
    Usage in route:
        @router.get("/protected")
        async def protected_route(user: dict = Depends(get_current_user)):
            ...
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        # Verify Firebase token
        firebase_user = firebase_service.verify_token(credentials.credentials)
        uid = firebase_user["uid"]

        # ★ Check cache first — skip Supabase if we have a recent lookup
        cached = _get_cached_user(uid)
        if cached:
            return cached

        # Cache miss — query Supabase
        db_user = supabase_service.get_user_by_firebase_uid(uid)

        if db_user:
            user_data = {
                "id": db_user["id"],
                "firebase_uid": uid,
                "email": firebase_user["email"],
                "name": firebase_user.get("name", db_user.get("name", "")),
                "avatar_url": firebase_user.get("picture", db_user.get("avatar_url", "")),
            }
        else:
            # Auto-create user on first API call
            new_user = supabase_service.upsert_user(
                firebase_uid=uid,
                email=firebase_user["email"],
                name=firebase_user.get("name", ""),
                avatar_url=firebase_user.get("picture", ""),
            )
            user_data = {
                "id": new_user["id"],
                "firebase_uid": uid,
                "email": firebase_user["email"],
                "name": firebase_user.get("name", ""),
                "avatar_url": firebase_user.get("picture", ""),
            }

        _set_cached_user(uid, user_data)
        return user_data

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
