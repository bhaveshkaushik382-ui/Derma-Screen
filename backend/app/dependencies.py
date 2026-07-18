"""
DermaScreen — Dependencies
FastAPI dependency injection for authentication.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services import firebase_service, supabase_service

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency that extracts and verifies the Firebase ID token from the
    Authorization header. Returns user info dict with uid, email, name.
    
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

        # Get or create Supabase user record
        db_user = supabase_service.get_user_by_firebase_uid(firebase_user["uid"])

        if db_user:
            return {
                "id": db_user["id"],
                "firebase_uid": firebase_user["uid"],
                "email": firebase_user["email"],
                "name": firebase_user.get("name", db_user.get("name", "")),
                "avatar_url": firebase_user.get("picture", db_user.get("avatar_url", "")),
            }
        else:
            # Auto-create user on first API call
            new_user = supabase_service.upsert_user(
                firebase_uid=firebase_user["uid"],
                email=firebase_user["email"],
                name=firebase_user.get("name", ""),
                avatar_url=firebase_user.get("picture", ""),
            )
            return {
                "id": new_user["id"],
                "firebase_uid": firebase_user["uid"],
                "email": firebase_user["email"],
                "name": firebase_user.get("name", ""),
                "avatar_url": firebase_user.get("picture", ""),
            }

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
