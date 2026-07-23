"""
DermaScreen — Scans Router
Endpoints for image upload, scan CRUD operations.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.schemas.models import ScanResponse, ScanListResponse, UploadResponse
from app.services import supabase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/scans", tags=["Scans"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/webp"}


@router.post("/upload", response_model=UploadResponse)
async def upload_scan_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Upload a skin image to Supabase Storage."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: JPG, PNG, WEBP",
        )

    # Read file
    file_bytes = await file.read()

    # Validate file size
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: 25 MB",
        )

    # Upload to Supabase Storage
    try:
        image_url = supabase_service.upload_image(
            file_bytes=file_bytes,
            filename=file.filename or "scan.jpg",
            user_id=user["id"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    # Generate a temporary scan ID
    temp_scan_id = f"DS-{uuid.uuid4().hex[:4].upper()}"

    return UploadResponse(image_url=image_url, temp_scan_id=temp_scan_id)


@router.get("/", response_model=ScanListResponse)
async def list_scans(user: dict = Depends(get_current_user)):
    """List all scans for the authenticated user."""
    scans = supabase_service.get_scans(user["id"])

    scan_responses = []
    for s in scans:
        # Format the date for frontend display
        date_str = s.get("created_at", "")
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%b %d, %Y")
        except Exception:
            formatted_date = date_str

        # Parse quality_score if it is a JSON string
        q_score = s.get("quality_score")
        if isinstance(q_score, str):
            try:
                import json
                q_score = json.loads(q_score)
            except Exception:
                q_score = None

        grad_cam_img = s.get("grad_cam_image") or (q_score.get("grad_cam_image") if isinstance(q_score, dict) else None)

        scan_responses.append(ScanResponse(
            id=s.get("id"),
            scan_id=s.get("scan_id", ""),
            image_url=s.get("image_url", ""),
            condition=s.get("condition", ""),
            confidence=str(s.get("confidence", "0")) + ("%" if "%" not in str(s.get("confidence", "")) else ""),
            risk=s.get("risk", "Low"),
            status=s.get("status", "Completed"),
            notes=s.get("notes", ""),
            quality_score=q_score,
            grad_cam_image=grad_cam_img,
            created_at=date_str,
            date=formatted_date,
        ))

    return ScanListResponse(scans=scan_responses, total=len(scan_responses))


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, user: dict = Depends(get_current_user)):
    """Get a single scan by its scan_id."""
    scan = supabase_service.get_scan(scan_id, user["id"])

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    date_str = scan.get("created_at", "")
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        formatted_date = dt.strftime("%b %d, %Y")
    except Exception:
        formatted_date = date_str

    # Parse quality_score if it is a JSON string
    q_score = scan.get("quality_score")
    if isinstance(q_score, str):
        try:
            import json
            q_score = json.loads(q_score)
        except Exception:
            q_score = None

    grad_cam_img = scan.get("grad_cam_image") or (q_score.get("grad_cam_image") if isinstance(q_score, dict) else None)

    return ScanResponse(
        id=scan.get("id"),
        scan_id=scan.get("scan_id", ""),
        image_url=scan.get("image_url", ""),
        condition=scan.get("condition", ""),
        confidence=str(scan.get("confidence", "0")) + ("%" if "%" not in str(scan.get("confidence", "")) else ""),
        risk=scan.get("risk", "Low"),
        status=scan.get("status", "Completed"),
        notes=scan.get("notes", ""),
        quality_score=q_score,
        grad_cam_image=grad_cam_img,
        created_at=date_str,
        date=formatted_date,
    )


@router.delete("/{scan_id}")
async def delete_scan(scan_id: str, user: dict = Depends(get_current_user)):
    """Delete a scan."""
    deleted = supabase_service.delete_scan(scan_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan deleted successfully"}
