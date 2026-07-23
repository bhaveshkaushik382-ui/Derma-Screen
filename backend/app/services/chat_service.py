"""
DermaScreen — Chat Service
Integrates with OpenRouter API for AI-powered dermatology assistant.
Supports text, image, and PDF inputs with intelligent model routing.
"""

import io
import base64
import httpx
from datetime import datetime
from app.config import settings

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Models that support vision/multimodal (image inputs)
VISION_CAPABLE_MODELS = {
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "openai/gpt-4-turbo",
    "google/gemini-pro-vision",
    "google/gemini-2.0-flash-001",
    "google/gemini-2.5-flash-preview",
    "anthropic/claude-sonnet-4",
    "anthropic/claude-3.5-sonnet",
}

SYSTEM_PROMPT = """You are DermaScreen AI Assistant — an advanced clinical dermatology AI expert with deep knowledge of skin conditions, dermatopathology, treatments, and patient care.

## Core Capabilities
You are a highly trained medical AI with comprehensive knowledge of:
- All skin conditions: cancers (melanoma, BCC, SCC), benign growths, infections, inflammatory conditions, autoimmune skin diseases
- Dermatological diagnostics: dermoscopy, histopathology, ABCDE criteria, clinical staging
- Treatment protocols: prescription medications, OTC remedies, surgical procedures, phototherapy, immunotherapy
- General medicine related to skin: systemic diseases with skin manifestations, drug reactions, allergies
- Skincare science: ingredients, routines, sun protection, anti-aging, wound care
- Clinical report interpretation: pathology reports, lab results, imaging findings

## How To Respond
- **Be an expert**: Use your full medical knowledge to answer ANY question the user asks — whether about skin conditions, treatments, medications, skincare routines, symptoms, or their scan results. You are NOT limited to predefined topics.
- **Be specific**: Name specific conditions, medicines, dosages, creams, and treatments. Don't give vague answers.
- **Use scan data when available**: When the user asks about their scans/reports, analyze the scan context data provided. Explain the condition found, what it means, risk level, treatments, and next steps in detail.
- **Read and analyze documents**: When the user uploads a PDF report or clinical document, the extracted text will be provided. Analyze it thoroughly — explain findings, flag abnormalities, interpret medical terminology, and give clear recommendations.
- **Be comprehensive but clear**: Structure answers with headers, bullet points, or numbered lists. Keep language patient-friendly while being medically accurate.
- **Give actionable advice**: Always provide concrete next steps — what to do, what to buy, what to watch for, when to see a doctor.

## Guidelines
- Always include a brief disclaimer that you're an AI assistant and recommend consulting a board-certified dermatologist for formal diagnosis.
- Be empathetic and reassuring while being honest about serious findings.
- If asked about topics outside dermatology/medicine, politely redirect to your area of expertise.
- For ANY question about skin, health, medicine, or their reports — give a thorough, expert-quality answer.
"""


def _is_vision_capable() -> bool:
    """Check if the configured model supports multimodal (image) inputs."""
    model = settings.OPENROUTER_MODEL.lower()
    return any(m in model for m in VISION_CAPABLE_MODELS)


def _extract_pdf_text(base64_data: str) -> str:
    """
    Extract text from a base64-encoded PDF.
    Tries PyPDF2 first, then pdfplumber as fallback.
    Returns extracted text or empty string on failure.
    """
    try:
        # Remove the data URL prefix if present
        if "," in base64_data:
            base64_data = base64_data.split(",", 1)[1]

        pdf_bytes = base64.b64decode(base64_data)
        pdf_file = io.BytesIO(pdf_bytes)

        # Try PyPDF2 first
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(pdf_file)
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
            if text_parts:
                return "\n\n".join(text_parts)
        except ImportError:
            pass
        except Exception as e:
            print(f"[WARN] PyPDF2 extraction failed: {e}")

        # Try pdfplumber as fallback
        pdf_file.seek(0)
        try:
            import pdfplumber
            with pdfplumber.open(pdf_file) as pdf:
                text_parts = []
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text.strip())
                if text_parts:
                    return "\n\n".join(text_parts)
        except ImportError:
            pass
        except Exception as e:
            print(f"[WARN] pdfplumber extraction failed: {e}")

        return ""
    except Exception as e:
        print(f"[ERROR] PDF extraction error: {e}")
        return ""


async def get_chat_response(message: str, history: list = None, context: str = None, image_url: str = None) -> str:
    """
    Send a message to OpenRouter and return the AI response.
    Handles text, images (for vision models), and PDFs (text extraction).

    Args:
        message: The user's message
        history: Optional list of previous messages [{"sender": "user"|"assistant", "text": "..."}]
        context: Optional user scans context to ground the assistant
        image_url: Optional base64 or public image URL (or PDF data URL)

    Returns:
        AI response text
    """
    if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY.startswith("#"):
        return (
            "The AI assistant is not configured yet. Please set your OpenRouter API key "
            "in the backend environment variables to enable AI-powered responses."
        )

    # Build system prompt with context
    system_prompt = SYSTEM_PROMPT
    if context:
        system_prompt += f"\n{context}"

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 messages for context)
    if history:
        for msg in history[-10:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})

    # Check model capabilities
    vision_ok = _is_vision_capable()

    # ─── Handle different input types ───
    if image_url and image_url.startswith("data:application/pdf"):
        # PDF uploaded — extract text and include in message
        pdf_text = _extract_pdf_text(image_url)
        if pdf_text:
            pdf_prompt = (
                f"{message}\n\n"
                f"--- UPLOADED CLINICAL DOCUMENT ---\n"
                f"{pdf_text[:8000]}\n"  # Cap at 8000 chars to stay within token limits
                f"--- END OF DOCUMENT ---\n\n"
                f"Please analyze this clinical document thoroughly. Explain the findings, "
                f"interpret any medical terminology, flag any abnormalities or concerns, "
                f"and provide clear recommendations."
            )
            messages.append({"role": "user", "content": pdf_prompt})
        else:
            # PDF extraction failed — inform user
            messages.append({
                "role": "user",
                "content": (
                    f"{message}\n\n"
                    "[Note: A PDF document was uploaded but the text could not be extracted. "
                    "Please ask the user to either copy-paste the report text into the chat, "
                    "or upload a screenshot/image of the document instead.]"
                )
            })

    elif image_url and vision_ok:
        # Image uploaded + model supports vision — send multimodal
        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": message},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        })

    elif image_url and not vision_ok:
        # Image available but model is text-only — rely on scan context data
        image_note = (
            "\n\n[The user's scan image is on file. Use the scan context data provided "
            "in the system prompt to analyze and explain the findings thoroughly. "
            "Do NOT tell the user you cannot see the image — analyze using the scan data.]"
        )
        messages.append({"role": "user", "content": message + image_note})

    else:
        # Plain text message
        messages.append({"role": "user", "content": message})

    # ─── Call OpenRouter API ───
    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": settings.FRONTEND_URL,
                    "X-Title": "DermaScreen AI Assistant",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": messages,
                    "max_tokens": 1500,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()

            # Extract the assistant's reply
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            if reply:
                return reply.strip()
            else:
                print(f"[WARN] Empty response from OpenRouter. Full response: {data}")
                return "I apologize, but I couldn't generate a response. Please try asking again."

    except httpx.TimeoutException:
        print("[ERROR] OpenRouter request timed out after 90s")
        return (
            "I'm sorry, the AI model is taking too long to respond. This can happen with complex questions. "
            "Please try again in a moment, or try a shorter question."
        )
    except httpx.HTTPStatusError as e:
        error_body = e.response.text
        status_code = e.response.status_code
        print(f"[ERROR] OpenRouter API error {status_code}: {error_body}")

        if status_code == 402:
            return (
                "The AI service has run out of credits. Please update your OpenRouter API key "
                "or add credits at https://openrouter.ai/credits."
            )
        elif status_code == 429:
            return "The AI service is experiencing high demand. Please wait a moment and try again."
        elif status_code == 400:
            return (
                "There was an issue processing your request. Please try rephrasing your question "
                "or removing any attachments and trying again."
            )
        else:
            return (
                f"I encountered a temporary issue (error {status_code}). "
                "Please try again in a moment."
            )
    except Exception as e:
        print(f"[ERROR] Chat service error: {type(e).__name__}: {e}")
        return (
            "I'm experiencing a temporary issue connecting to the AI service. "
            "Please try again in a moment."
        )
