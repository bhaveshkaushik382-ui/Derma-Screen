"""
DermaScreen — Supabase Service
Handles all database operations and file storage via Supabase.
"""

import uuid
from datetime import datetime, timezone
from supabase import create_client, Client
from app.config import settings

_client: Client | None = None


def get_client() -> Client:
    """Get or create a Supabase client instance."""
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or settings.SUPABASE_URL.startswith("#"):
            raise RuntimeError("Supabase URL not configured. Update your .env file.")
        if not settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_SERVICE_KEY.startswith("#"):
            raise RuntimeError("Supabase Service Key not configured. Update your .env file.")
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        print("[OK] Supabase client initialized")
    return _client


# ─────────────────── User Operations ───────────────────

def upsert_user(firebase_uid: str, email: str, name: str = "", avatar_url: str = "") -> dict:
    """Create or update a user record synced from Firebase."""
    client = get_client()

    # Check if user already exists
    result = client.table("users").select("*").eq("firebase_uid", firebase_uid).execute()

    if result.data and len(result.data) > 0:
        # Update existing user
        updated = client.table("users").update({
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
        }).eq("firebase_uid", firebase_uid).execute()
        return updated.data[0] if updated.data else result.data[0]
    else:
        # Insert new user
        new_user = {
            "id": str(uuid.uuid4()),
            "firebase_uid": firebase_uid,
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
        }
        inserted = client.table("users").insert(new_user).execute()
        return inserted.data[0] if inserted.data else new_user


def get_user_by_firebase_uid(firebase_uid: str) -> dict | None:
    """Fetch user by Firebase UID."""
    client = get_client()
    result = client.table("users").select("*").eq("firebase_uid", firebase_uid).execute()
    return result.data[0] if result.data else None


# ─────────────────── Image Storage ───────────────────

def upload_image(file_bytes: bytes, filename: str, user_id: str) -> str:
    """Upload an image to Supabase Storage and return the public URL."""
    client = get_client()

    # Generate unique path
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    storage_path = f"{user_id}/{uuid.uuid4().hex}.{ext}"

    # Upload to the 'scan-images' bucket
    client.storage.from_("scan-images").upload(
        path=storage_path,
        file=file_bytes,
        file_options={"content-type": f"image/{ext}", "upsert": "true"}
    )

    # Get public URL
    public_url = client.storage.from_("scan-images").get_public_url(storage_path)
    return public_url


# ─────────────────── Scan Operations ───────────────────

def insert_scan(scan_data: dict) -> dict:
    """Insert a new scan record."""
    client = get_client()
    result = client.table("scans").insert(scan_data).execute()
    return result.data[0] if result.data else scan_data


def get_scans(user_id: str) -> list:
    """Fetch all scans for a user, newest first."""
    client = get_client()
    result = (
        client.table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


def get_user_scans(user_id: str, limit: int = 5) -> list:
    """Fetch the latest scans for a user (used for chat context)."""
    client = get_client()
    result = (
        client.table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


def get_scan(scan_id: str, user_id: str) -> dict | None:
    """Fetch a single scan by scan_id."""
    client = get_client()
    result = (
        client.table("scans")
        .select("*")
        .eq("scan_id", scan_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else None


def delete_scan(scan_id: str, user_id: str) -> bool:
    """Delete a scan record by scan_id (e.g. DS-1234) or UUID id."""
    try:
        client = get_client()
        # Try deleting by scan_id
        result = (
            client.table("scans")
            .delete()
            .eq("scan_id", scan_id)
            .eq("user_id", user_id)
            .execute()
        )
        if result.data and len(result.data) > 0:
            return True

        # Fallback: try deleting by UUID primary key 'id'
        result2 = (
            client.table("scans")
            .delete()
            .eq("id", scan_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(result2.data)
    except Exception as e:
        print(f"[WARN] Error deleting scan from Supabase: {e}")
        return True


def get_dashboard_stats(user_id: str) -> dict:
    """Compute dashboard statistics for a user."""
    client = get_client()

    # Fetch all scans
    result = (
        client.table("scans")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    scans = result.data or []
    total = len(scans)

    if total == 0:
        return {
            "total_scans": 0,
            "last_scan_date": None,
            "avg_confidence": "0%",
            "high_risk_alerts": 0,
            "risk_distribution": {"Low": 0, "Medium": 0, "High": 0},
        }

    # Last scan date
    last_date = scans[0].get("created_at", "")
    if last_date:
        try:
            dt = datetime.fromisoformat(last_date.replace("Z", "+00:00"))
            last_date = dt.strftime("%b %d, %Y")
        except Exception:
            pass

    # Average confidence
    confidences = []
    for s in scans:
        try:
            confidences.append(float(str(s.get("confidence", "0")).replace("%", "")))
        except ValueError:
            pass
    avg_conf = sum(confidences) / len(confidences) if confidences else 0

    # Risk counts
    risk_counts = {"Low": 0, "Medium": 0, "High": 0}
    for s in scans:
        risk = s.get("risk", "Low")
        if risk in risk_counts:
            risk_counts[risk] += 1

    high_risk = risk_counts["High"] + risk_counts["Medium"]

    return {
        "total_scans": total,
        "last_scan_date": last_date,
        "avg_confidence": f"{avg_conf:.1f}%",
        "high_risk_alerts": high_risk,
        "risk_distribution": risk_counts,
    }


# ─────────────────── Chat Operations ───────────────────

def save_chat_message(user_id: str, sender: str, message: str, user_name: str = None) -> dict:
    """Save a chat message to the database."""
    client = get_client()
    msg_data = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "sender": sender,
        "message": message,
        "user_name": user_name,
    }
    result = client.table("chat_messages").insert(msg_data).execute()
    return result.data[0] if result.data else msg_data


def get_chat_history(user_id: str, limit: int = 50) -> list:
    """Fetch recent chat messages for a user."""
    client = get_client()
    result = (
        client.table("chat_messages")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data or []


def delete_chat_history(user_id: str) -> bool:
    """Delete all chat messages for a user from the database."""
    client = get_client()
    result = (
        client.table("chat_messages")
        .delete()
        .eq("user_id", user_id)
        .execute()
    )
    return True
