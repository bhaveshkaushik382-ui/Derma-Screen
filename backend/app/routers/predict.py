"""
DermaScreen — Predict Router
Endpoint for ML-based skin lesion classification.
"""

import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.schemas.models import PredictResponse
from app.services import ml_service, quality_service, supabase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/predict", tags=["ML Prediction"])


@router.post("/", response_model=PredictResponse)
async def predict_lesion(
    file: UploadFile = File(...),
    abcde_answers: str = Form(None),
    user: dict = Depends(get_current_user),
):
    """
    Full scan pipeline:
    1. Run image quality checks
    2. Upload image to Supabase Storage
    3. Run ML model prediction
    4. Save scan record to Supabase DB
    5. Return complete result
    """
    # Read file
    file_bytes = await file.read()

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")

    # Parse abcde_answers
    abcde_dict = None
    if abcde_answers:
        try:
            abcde_dict = json.loads(abcde_answers)
        except Exception:
            abcde_dict = None

    # ──── Step 1: Quality Analysis ────
    try:
        quality_result = quality_service.analyze_image_quality(file_bytes)
    except Exception as e:
        quality_result = {"quality_passed": True, "quality_warning": None}

    quality_warning = quality_result.get("quality_warning")

    # ──── Step 2: Upload Image ────
    try:
        image_url = supabase_service.upload_image(
            file_bytes=file_bytes,
            filename=file.filename or "scan.jpg",
            user_id=user["id"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    # ──── Step 3: ML Prediction ────
    prediction = ml_service.predict(file_bytes, abcde_answers=abcde_dict)

    # Extract GradCAM image before building the response
    grad_cam_raw = prediction.get("grad_cam_image")
    grad_cam_url = None

    if grad_cam_raw:
        if grad_cam_raw.startswith("data:image"):
            # Upload GradCAM heatmap PNG to Supabase Storage for permanent storage
            try:
                import base64
                header, encoded = grad_cam_raw.split(",", 1)
                g_bytes = base64.b64decode(encoded)
                grad_cam_url = supabase_service.upload_image(
                    file_bytes=g_bytes,
                    filename=f"gradcam_{uuid.uuid4().hex[:6]}.png",
                    user_id=user["id"],
                )
            except Exception as e:
                print(f"[WARN] Failed to upload GradCAM to storage: {e}")
                grad_cam_url = grad_cam_raw
        else:
            grad_cam_url = grad_cam_raw

    # ──── Step 4: Save to Database ────
    scan_id = f"DS-{uuid.uuid4().hex[:4].upper()}"
    now = datetime.now(timezone.utc)
    formatted_date = now.strftime("%b %d, %Y")

    # Build quality score JSON for storage (include grad_cam_image inside quality_score JSON as backup)
    quality_score = {
        k: quality_result[k]
        for k in ["resolution", "blur", "lighting", "lesion"]
        if k in quality_result
    }
    if grad_cam_url:
        quality_score["grad_cam_image"] = grad_cam_url

    scan_record = {
        "id": str(uuid.uuid4()),
        "scan_id": scan_id,
        "user_id": user["id"],
        "user_name": user.get("name", "User"),
        "image_url": image_url,
        "condition": prediction["condition"],
        "confidence": float(prediction["confidence"].replace("%", "")),
        "risk": prediction["risk"],
        "status": "Completed",
        "notes": prediction["notes"],
        "quality_score": json.dumps(quality_score),
    }
    if grad_cam_url:
        scan_record["grad_cam_image"] = grad_cam_url

    try:
        supabase_service.insert_scan(scan_record)
    except Exception as e:
        print(f"  Primary insert with grad_cam_image column failed: {e}. Retrying without top-level column...")
        # Fallback if DB table lacks top-level grad_cam_image column
        scan_record_fallback = dict(scan_record)
        scan_record_fallback.pop("grad_cam_image", None)
        try:
            supabase_service.insert_scan(scan_record_fallback)
        except Exception as e2:
            print(f"  Failed to save scan to DB fallback: {e2}")

    # Append quality warning to notes if present
    notes = prediction["notes"]
    if quality_warning and not quality_result.get("quality_passed", True):
        notes = f"Image quality warning: {quality_warning}\n\n{notes}"

    return PredictResponse(
        scan_id=scan_id,
        condition=prediction["condition"],
        confidence=prediction["confidence"],
        risk=prediction["risk"],
        status="Completed",
        notes=notes,
        image_url=image_url,
        date=formatted_date,
        quality_warning=quality_warning,
        grad_cam_image=grad_cam_url or grad_cam_raw,
    )
