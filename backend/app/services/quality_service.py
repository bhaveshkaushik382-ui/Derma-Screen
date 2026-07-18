"""
DermaScreen — Image Quality Analysis Service
Uses OpenCV, Pillow, and the user's trained image_quality.pkl config
to assess image quality for clinical skin analysis.
Checks: Resolution, Blur, Lighting, and Lesion Visibility.
"""

import io
import pickle
import numpy as np
from PIL import Image
from pathlib import Path
from app.config import settings

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("[WARN] OpenCV not available. Quality analysis will use basic checks only.")

# ─────────────────────────────────────────────────────────────
# Image Quality Config — loaded from image_quality.pkl
# ─────────────────────────────────────────────────────────────
_quality_config = None


def load_quality_config():
    """Load the image quality config from the user's trained pickle."""
    global _quality_config

    config_path = settings.get_image_quality_model_path()

    if config_path.exists():
        try:
            with open(config_path, "rb") as f:
                _quality_config = pickle.load(f)
            print(f"[OK] Image quality config loaded: {config_path.name}")
            print(f"   Blur threshold: {_quality_config.get('blur_threshold', 'N/A')}")
            print(f"   Brightness range: {_quality_config.get('brightness_min', 'N/A')}-{_quality_config.get('brightness_max', 'N/A')}")
            print(f"   Min resolution: {_quality_config.get('min_resolution', 'N/A')}px")
        except Exception as e:
            print(f"[WARN] Error loading image quality config: {e}")
            _quality_config = _default_config()
    else:
        print(f"[WARN] image_quality.pkl not found at {config_path}. Using default thresholds.")
        _quality_config = _default_config()


def _default_config() -> dict:
    """Fallback thresholds if the pickle is not available."""
    return {
        "blur_threshold": 28,
        "brightness_min": 60,
        "brightness_max": 200,
        "min_resolution": 224,
        "feedback_messages": {
            "blur": "Image looks blurry — please retake with a steady hand",
            "too_dark": "Image is too dark — use brighter lighting, avoid shadows",
            "too_bright": "Image is overexposed — avoid direct flash or harsh light",
            "low_resolution": "Resolution too low — need at least 224x224px",
        },
    }


def _get_config() -> dict:
    """Get the quality config, loading it if necessary."""
    global _quality_config
    if _quality_config is None:
        load_quality_config()
    return _quality_config


def analyze_image_quality(image_bytes: bytes) -> dict:
    """
    Run 4 quality checks on a skin image.
    Returns a dict with per-check results and an overall quality_passed flag.
    """
    cfg = _get_config()

    # Open image with Pillow
    img_pil = Image.open(io.BytesIO(image_bytes))
    width, height = img_pil.size

    # Convert to numpy array for OpenCV analysis
    img_array = np.array(img_pil.convert("RGB"))

    results = {}

    # ────────── 1. Resolution Check ──────────
    results["resolution"] = _check_resolution(width, height, cfg)

    # ────────── 2. Blur Detection ──────────
    results["blur"] = _check_blur(img_array, cfg)

    # ────────── 3. Lighting Quality ──────────
    results["lighting"] = _check_lighting(img_array, cfg)

    # ────────── 4. Lesion Visibility ──────────
    results["lesion"] = _check_lesion_visibility(img_array)

    # ────────── Overall Assessment ──────────
    statuses = [results[k]["status"] for k in results]
    error_count = statuses.count("error")
    warning_count = statuses.count("warning")

    quality_passed = error_count == 0
    quality_warning = None

    if error_count > 0:
        quality_warning = (
            "Image quality is too poor for reliable analysis. "
            "Please retake with better conditions."
        )
    elif warning_count > 0:
        quality_warning = (
            "Some quality metrics are sub-optimal. "
            "Results may have reduced accuracy."
        )

    return {
        **results,
        "quality_passed": quality_passed,
        "quality_warning": quality_warning,
    }


def _check_resolution(width: int, height: int, cfg: dict) -> dict:
    """Check if image resolution is adequate for analysis."""
    resolution_str = f"{width} x {height} px"
    min_res = cfg.get("min_resolution", 224)

    if width >= 512 and height >= 512:
        return {"status": "success", "label": "Resolution", "value": resolution_str}
    elif width >= min_res and height >= min_res:
        return {"status": "warning", "label": "Resolution", "value": f"{resolution_str} (low)"}
    else:
        feedback = cfg.get("feedback_messages", {}).get("low_resolution", f"Too low (min {min_res}px)")
        return {"status": "error", "label": "Resolution", "value": f"{resolution_str} — {feedback}"}


def _check_blur(img_array: np.ndarray, cfg: dict) -> dict:
    """Detect blur using Laplacian variance (calibrated from HAM10000 via image_quality.pkl)."""
    if not CV2_AVAILABLE:
        return {"status": "success", "label": "Blur Detection", "value": "Check unavailable"}

    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

    blur_threshold = cfg.get("blur_threshold", 28)
    sharpness_str = f"Score: {laplacian_var:.1f}"

    if laplacian_var >= blur_threshold:
        return {"status": "success", "label": "Blur Detection", "value": f"Clear ({sharpness_str})"}
    elif laplacian_var >= blur_threshold * 0.5:
        return {"status": "warning", "label": "Blur Detection", "value": f"Slightly Blurry ({sharpness_str})"}
    else:
        feedback = cfg.get("feedback_messages", {}).get("blur", "Too blurry")
        return {"status": "error", "label": "Blur Detection", "value": f"{feedback} ({sharpness_str})"}


def _check_lighting(img_array: np.ndarray, cfg: dict) -> dict:
    """Check lighting quality via mean brightness of grayscale image."""
    if not CV2_AVAILABLE:
        gray = np.mean(img_array, axis=2)
        mean_brightness = np.mean(gray)
    else:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        mean_brightness = np.mean(gray)

    brightness_min = cfg.get("brightness_min", 60)
    brightness_max = cfg.get("brightness_max", 200)
    feedback_msgs = cfg.get("feedback_messages", {})

    if brightness_min < mean_brightness < brightness_max:
        return {"status": "success", "label": "Lighting Quality", "value": "Well-lit"}
    elif brightness_min * 0.75 < mean_brightness <= brightness_min:
        return {"status": "warning", "label": "Lighting Quality", "value": "Under-exposed"}
    elif brightness_max <= mean_brightness < brightness_max * 1.15:
        return {"status": "warning", "label": "Lighting Quality", "value": "Over-exposed"}
    elif mean_brightness <= brightness_min * 0.75:
        msg = feedback_msgs.get("too_dark", "Too dark")
        return {"status": "error", "label": "Lighting Quality", "value": msg}
    else:
        msg = feedback_msgs.get("too_bright", "Too bright")
        return {"status": "error", "label": "Lighting Quality", "value": msg}


def _check_lesion_visibility(img_array: np.ndarray) -> dict:
    """Check lesion visibility via edge detection and contour analysis."""
    if not CV2_AVAILABLE:
        return {"status": "success", "label": "Lesion Visibility", "value": "Check unavailable"}

    gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Edge detection
    edges = cv2.Canny(blurred, 50, 150)

    # Count edge pixels as percentage of total
    edge_ratio = np.count_nonzero(edges) / edges.size

    # Also check contrast (standard deviation of grayscale)
    contrast = np.std(gray)

    if contrast > 40 and edge_ratio > 0.01:
        return {"status": "success", "label": "Lesion Visibility", "value": "Clear contrast"}
    elif contrast > 25 or edge_ratio > 0.005:
        return {"status": "warning", "label": "Lesion Visibility", "value": "Low contrast"}
    else:
        return {"status": "error", "label": "Lesion Visibility", "value": "No visible lesion detected"}
