"""
DermaScreen — Auth Router
Endpoints for Firebase authentication and user profile management.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.schemas.models import TokenVerifyRequest, UserResponse
from app.services import firebase_service, supabase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/verify", response_model=UserResponse)
async def verify_token(request: TokenVerifyRequest):
    """
    Verify a Firebase ID token and sync the user to Supabase.
    Called by the frontend after Firebase client-side authentication.
    """
    try:
        firebase_user = firebase_service.verify_token(request.id_token)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    # Upsert user in Supabase
    db_user = supabase_service.upsert_user(
        firebase_uid=firebase_user["uid"],
        email=firebase_user["email"],
        name=firebase_user.get("name", ""),
        avatar_url=firebase_user.get("picture", ""),
    )

    return UserResponse(
        id=db_user.get("id"),
        firebase_uid=firebase_user["uid"],
        email=firebase_user["email"],
        name=firebase_user.get("name", db_user.get("name", "")),
        avatar_url=firebase_user.get("picture", db_user.get("avatar_url", "")),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse(
        id=user.get("id"),
        firebase_uid=user["firebase_uid"],
        email=user["email"],
        name=user.get("name", ""),
        avatar_url=user.get("avatar_url", ""),
    )
