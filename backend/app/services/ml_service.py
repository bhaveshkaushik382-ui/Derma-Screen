"""
DermaScreen — ML Prediction Service
Loads a ResNet50 PyTorch model trained on HAM10000 binary classification
(benign vs suspicious) and generates GradCAM heatmaps.
"""

import io
import base64
import pickle
import numpy as np
from PIL import Image
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import models, transforms

from app.config import settings

# ─────────────────────────────────────────────────────────────
# Global references (loaded once on startup)
# ─────────────────────────────────────────────────────────────
_model = None
_model_loaded = False
_grad_cam_config = None  # full config from grad_cam.pkl

# ─────────────────────────────────────────────────────────────
# Defaults — overridden at load time from grad_cam.pkl
# ─────────────────────────────────────────────────────────────
CLASS_NAMES = ["benign", "suspicious"]
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
INPUT_SIZE = 224

# Risk tiers (overridden from grad_cam.pkl if available)
RISK_TIERS = {
    "Low Risk": {
        "threshold": 0.25,
        "color": "#00E5A0",
        "advice": "Monitor for changes. No urgent action needed.",
    },
    "Moderate Risk": {
        "threshold": 0.5,
        "color": "#FFC857",
        "advice": "Consider a routine check-up with a doctor.",
    },
    "High Risk": {
        "threshold": 0.75,
        "color": "#FF8C42",
        "advice": "See a dermatologist within the next few weeks.",
    },
    "Urgent Evaluation Recommended": {
        "threshold": 1.0,
        "color": "#FF5C5C",
        "advice": "Please see a dermatologist promptly.",
    },
}


def _build_model(num_classes: int = 2) -> nn.Module:
    """
    Build a ResNet50 with a custom FC head matching the trained checkpoint:
      fc = Sequential(Linear(2048,256), ReLU, Dropout(0.5), Linear(256, num_classes))
    """
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(
        nn.Linear(2048, 256),
        nn.ReLU(inplace=True),
        nn.Dropout(0.5),
        nn.Linear(256, num_classes),
    )
    return model


def load_model():
    """Load the PyTorch model and GradCAM config from disk. Called once during app startup."""
    global _model, _model_loaded, _grad_cam_config
    global CLASS_NAMES, IMAGENET_MEAN, IMAGENET_STD, INPUT_SIZE, RISK_TIERS

    # ──── Load GradCAM config first (contains metadata) ────
    grad_cam_path = settings.get_grad_cam_model_path()
    if grad_cam_path.exists():
        try:
            # Patch torch.load to always use CPU for nested deserialization
            _original_torch_load = torch.load

            def _cpu_torch_load(*args, **kwargs):
                kwargs["map_location"] = "cpu"
                kwargs["weights_only"] = False
                return _original_torch_load(*args, **kwargs)

            torch.load = _cpu_torch_load
            with open(grad_cam_path, "rb") as f:
                _grad_cam_config = pickle.load(f)
            torch.load = _original_torch_load

            # Override defaults with values from the config
            CLASS_NAMES = _grad_cam_config.get("class_names", CLASS_NAMES)
            IMAGENET_MEAN = _grad_cam_config.get("imagenet_mean", IMAGENET_MEAN)
            IMAGENET_STD = _grad_cam_config.get("imagenet_std", IMAGENET_STD)
            INPUT_SIZE = _grad_cam_config.get("input_size", INPUT_SIZE)
            RISK_TIERS = _grad_cam_config.get("risk_tiers", RISK_TIERS)

            print(f"  GradCAM config loaded: {grad_cam_path.name}")
            print(f"    Architecture: {_grad_cam_config.get('architecture', 'N/A')}")
            print(f"    Classes: {CLASS_NAMES}")
            print(f"    Test accuracy: {_grad_cam_config.get('test_accuracy', 'N/A')}")
            print(f"    Target layer: {_grad_cam_config.get('gradcam_target_layer', 'N/A')}")
        except Exception as e:
            print(f"  Warning: Could not load grad_cam.pkl: {e}")
    else:
        print(f"  grad_cam.pkl not found at {grad_cam_path}")

    # ──── Load model.pth ────
    model_path = settings.get_ml_model_path()

    if not model_path.exists():
        print(f"  ML model not found at: {model_path}")
        print("   Place your model.pth file in backend/models/.")
        print("   Predictions will use a fallback mock classifier.")
        _model_loaded = False
        return

    try:
        num_classes = len(CLASS_NAMES)
        _model = _build_model(num_classes=num_classes)

        state_dict = torch.load(model_path, map_location="cpu", weights_only=False)

        # Handle case where checkpoint is a dict with 'model_state_dict' key
        if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
            state_dict = state_dict["model_state_dict"]

        _model.load_state_dict(state_dict, strict=False)
        _model.eval()
        _model_loaded = True
        print(f"  ML model loaded: {model_path.name} (ResNet50, {num_classes}-class)")
    except Exception as e:
        print(f"  Error loading ML model: {e}")
        _model_loaded = False


def _get_transform():
    """Build the torchvision transform pipeline matching training preprocessing."""
    return transforms.Compose([
        transforms.Resize((INPUT_SIZE, INPUT_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    """Preprocess an image for model input. Returns a (1, 3, H, W) tensor."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    transform = _get_transform()
    tensor = transform(img).unsqueeze(0)  # Add batch dimension
    return tensor


def _get_risk_tier(suspicious_prob: float) -> tuple:
    """
    Map the 'suspicious' probability to a risk tier.
    Returns (risk_label, advice, color).
    """
    for tier_name, tier_info in RISK_TIERS.items():
        if suspicious_prob <= tier_info["threshold"]:
            return tier_name, tier_info["advice"], tier_info["color"]
    # Fallback to highest tier
    last_tier = list(RISK_TIERS.keys())[-1]
    return last_tier, RISK_TIERS[last_tier]["advice"], RISK_TIERS[last_tier]["color"]


def _generate_gradcam(image_bytes: bytes) -> str | None:
    """
    Generate a GradCAM heatmap overlay on the input image.
    Returns a base64-encoded PNG string, or None on failure.
    """
    if not _model_loaded or _model is None:
        return None

    try:
        import cv2
    except ImportError:
        return None

    try:
        # Open image
        img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        transform = _get_transform()
        input_tensor = transform(img_pil).unsqueeze(0)
        input_tensor.requires_grad_(True)

        # Hook into target layer (layer4[-1])
        activations = []
        gradients = []

        target_layer = _model.layer4[-1]

        def forward_hook(module, input, output):
            activations.append(output.detach())

        def backward_hook(module, grad_input, grad_output):
            gradients.append(grad_output[0].detach())

        fh = target_layer.register_forward_hook(forward_hook)
        bh = target_layer.register_full_backward_hook(backward_hook)

        # Forward pass
        output = _model(input_tensor)
        pred_class = output.argmax(dim=1).item()

        # Backward pass on predicted class
        _model.zero_grad()
        output[0, pred_class].backward()

        # Remove hooks
        fh.remove()
        bh.remove()

        # Compute GradCAM
        act = activations[0].squeeze(0)   # (C, H, W)
        grad = gradients[0].squeeze(0)    # (C, H, W)
        weights = grad.mean(dim=(1, 2))   # (C,)
        cam = torch.zeros(act.shape[1:], dtype=torch.float32)  # (H, W)
        for i, w in enumerate(weights):
            cam += w * act[i]
        cam = F.relu(cam)
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()

        # Resize CAM to original image size
        cam_np = cam.numpy()
        img_np = np.array(img_pil)
        cam_resized = cv2.resize(cam_np, (img_np.shape[1], img_np.shape[0]))

        # Create heatmap overlay
        heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)

        # Blend with original image
        overlay = np.float32(heatmap) * 0.4 + np.float32(img_np) * 0.6
        overlay = np.clip(overlay, 0, 255).astype(np.uint8)

        # Encode to base64 PNG
        overlay_pil = Image.fromarray(overlay)
        buffer = io.BytesIO()
        overlay_pil.save(buffer, format="PNG", quality=85)
        buffer.seek(0)
        b64_str = base64.b64encode(buffer.read()).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"

    except Exception as e:
        print(f"  GradCAM generation error: {e}")
        return None


def predict(image_bytes: bytes, abcde_answers: dict = None) -> dict:
    """
    Run the ML model on an image and return classification results.
    Returns: { condition, confidence, risk, notes, grad_cam_image }
    """
    global _model_loaded

    # Lazy load: load model on first prediction request
    if not _model_loaded and _model is None:
        print("[ML] Lazy loading model on first prediction request...")
        load_model()

    if not _model_loaded or _model is None:
        return _fallback_predict(abcde_answers)

    try:
        # Preprocess
        input_tensor = preprocess_image(image_bytes)

        # Inference
        with torch.no_grad():
            output = _model(input_tensor)
            probabilities = F.softmax(output, dim=1).squeeze(0)  # (num_classes,)

        # Extract predictions
        suspicious_prob = float(probabilities[1].item()) if len(probabilities) > 1 else 0.1

        # Calculate ABCDE clinical score
        abcde_score = 0
        if abcde_answers:
            abcde_score = sum(1 for val in abcde_answers.values() if val is True)
            print(f"[ABCDE Rule] Clinical questionnaire score: {abcde_score}/5 (Answers: {abcde_answers})")
            
            # Combine ML predictions with clinical ABCDE rule answers
            if abcde_score == 0:
                # Normal lesion: reduce suspicion by 75%
                suspicious_prob *= 0.25
            elif abcde_score == 1:
                # Mostly normal: reduce suspicion by 50%
                suspicious_prob *= 0.50
            elif abcde_score == 2:
                # Borderline: keep model prediction as-is
                pass
            elif abcde_score == 3:
                # Concerning: ensure at least 60% suspicion
                suspicious_prob = max(suspicious_prob, 0.60)
            elif abcde_score == 4:
                # Highly concerning: ensure at least 80% suspicion (High Risk)
                suspicious_prob = max(suspicious_prob, 0.80)
            elif abcde_score == 5:
                # Critical criteria met: force suspicion to 95% (Urgent Evaluation)
                suspicious_prob = 0.95

        # Re-determine classification class and confidence
        if suspicious_prob >= 0.5:
            pred_idx = 1
            pred_prob = suspicious_prob
        else:
            pred_idx = 0
            pred_prob = 1.0 - suspicious_prob

        # Map to class name
        condition = CLASS_NAMES[pred_idx].title() if pred_idx < len(CLASS_NAMES) else f"Class {pred_idx}"
        confidence = pred_prob * 100

        # Determine risk tier based on suspicious probability
        risk_label, advice, risk_color = _get_risk_tier(suspicious_prob)

        # Generate GradCAM heatmap
        grad_cam_image = _generate_gradcam(image_bytes)

        # Append ABCDE score context to notes
        notes = advice
        if abcde_answers:
            notes = f"{notes} (Clinical ABCDE Score: {abcde_score}/5)"

        return {
            "condition": condition,
            "confidence": f"{confidence:.1f}%",
            "risk": risk_label,
            "notes": notes,
            "grad_cam_image": grad_cam_image,
        }

    except Exception as e:
        print(f"  Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return _fallback_predict(abcde_answers)


def _fallback_predict(abcde_answers: dict = None) -> dict:
    """Fallback prediction when model is not available."""
    suspicious_prob = 0.21  # Default benign (low risk)
    
    abcde_score = 0
    if abcde_answers:
        abcde_score = sum(1 for val in abcde_answers.values() if val is True)
        if abcde_score == 0:
            suspicious_prob = 0.10
        elif abcde_score == 1:
            suspicious_prob = 0.20
        elif abcde_score == 2:
            suspicious_prob = 0.40
        elif abcde_score == 3:
            suspicious_prob = 0.65
        elif abcde_score == 4:
            suspicious_prob = 0.85
        elif abcde_score == 5:
            suspicious_prob = 0.95

    if suspicious_prob >= 0.5:
        condition = "Suspicious"
        pred_prob = suspicious_prob
    else:
        condition = "Benign"
        pred_prob = 1.0 - suspicious_prob

    # Determine risk tier based on suspicious probability
    risk_label, advice, risk_color = _get_risk_tier(suspicious_prob)
    
    abcde_text = f" (Clinical ABCDE Score: {abcde_score}/5)" if abcde_answers else ""

    return {
        "condition": condition,
        "confidence": f"{pred_prob * 100:.1f}%",
        "risk": risk_label,
        "notes": f"{advice}{abcde_text} (Fallback mode active)",
        "grad_cam_image": None,
    }
