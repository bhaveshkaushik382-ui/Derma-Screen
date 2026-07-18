"""
DermaScreen — Firebase Service
Initializes Firebase Admin SDK and provides token verification.
"""

import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

_initialized = False


def initialize_firebase():
    """Initialize Firebase Admin SDK (called once on app startup)."""
    global _initialized
    if _initialized:
        return

    account_path = settings.get_firebase_account_path()
    if account_path.exists():
        cred = credentials.Certificate(str(account_path))
        firebase_admin.initialize_app(cred)
        _initialized = True
        print(f"[OK] Firebase Admin SDK initialized from: {account_path.name}")
    else:
        print(f"[WARN] Firebase service account not found at: {account_path}")
        print("   Authentication will not work until you provide the file.")


def verify_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return decoded claims.
    Returns dict with: uid, email, name, picture, etc.
    """
    if not _initialized:
        raise RuntimeError("Firebase Admin SDK not initialized. Check your service account file.")

    decoded = auth.verify_id_token(id_token)
    return {
        "uid": decoded.get("uid"),
        "email": decoded.get("email", ""),
        "name": decoded.get("name", ""),
        "picture": decoded.get("picture", ""),
    }
