"""
DermaScreen — Quality Analysis Router
Endpoint for image quality assessment before ML prediction.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.schemas.models import QualityAnalysisResponse, QualityMetric
from app.services import quality_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/quality", tags=["Quality Analysis"])

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB


@router.post("/analyze", response_model=QualityAnalysisResponse)
async def analyze_quality(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """
    Run image quality analysis on an uploaded skin image.
    Returns metrics for: Resolution, Blur, Lighting, Lesion Visibility.
    Also returns quality_passed (bool) and quality_warning (optional message).
    """
    # Read file bytes
    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum: 25 MB")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")

    try:
        result = quality_service.analyze_image_quality(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quality analysis failed: {str(e)}")

    return QualityAnalysisResponse(
        resolution=QualityMetric(**result["resolution"]),
        lesion=QualityMetric(**result["lesion"]),
        blur=QualityMetric(**result["blur"]),
        lighting=QualityMetric(**result["lighting"]),
        quality_passed=result["quality_passed"],
        quality_warning=result.get("quality_warning"),
    )
