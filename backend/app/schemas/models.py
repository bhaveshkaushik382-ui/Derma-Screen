"""
DermaScreen Backend — Pydantic Schemas
Request/response models for API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ──────────────────────────── Auth ────────────────────────────

class TokenVerifyRequest(BaseModel):
    id_token: str


class UserResponse(BaseModel):
    id: Optional[str] = None
    firebase_uid: str
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


# ──────────────────────────── Quality ────────────────────────────

class QualityMetric(BaseModel):
    status: str  # "success", "warning", "error"
    label: str
    value: str


class QualityAnalysisResponse(BaseModel):
    resolution: QualityMetric
    lesion: QualityMetric
    blur: QualityMetric
    lighting: QualityMetric
    quality_passed: bool
    quality_warning: Optional[str] = None


# ──────────────────────────── Scans ────────────────────────────

class ScanResponse(BaseModel):
    id: Optional[str] = None
    scan_id: str
    image_url: str
    condition: str
    confidence: str
    risk: str
    status: str = "Completed"
    notes: Optional[str] = None
    quality_score: Optional[dict] = None
    created_at: Optional[str] = None
    date: Optional[str] = None  # formatted date string for frontend


class ScanListResponse(BaseModel):
    scans: List[ScanResponse]
    total: int


class UploadResponse(BaseModel):
    image_url: str
    temp_scan_id: str


# ──────────────────────────── Predict ────────────────────────────

class PredictRequest(BaseModel):
    image_url: str
    temp_scan_id: Optional[str] = None


class PredictResponse(BaseModel):
    scan_id: str
    condition: str
    confidence: str
    risk: str
    status: str = "Completed"
    notes: str
    image_url: str
    date: str
    quality_warning: Optional[str] = None
    grad_cam_image: Optional[str] = None  # base64-encoded GradCAM heatmap overlay


# ──────────────────────────── Chat ────────────────────────────

class ChatMessage(BaseModel):
    sender: str  # "user" or "assistant"
    text: str
    time: Optional[str] = None
    user_name: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    image_url: Optional[str] = None


class ChatResponse(BaseModel):
    id: int
    sender: str = "assistant"
    text: str
    time: str
    user_name: Optional[str] = None


# ──────────────────────────── Dashboard ────────────────────────────

class DashboardStats(BaseModel):
    total_scans: int
    last_scan_date: Optional[str] = None
    avg_confidence: str
    high_risk_alerts: int
    risk_distribution: dict = {}
