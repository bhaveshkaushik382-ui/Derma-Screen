"""
DermaScreen — Chat Service
Integrates with OpenRouter API for AI-powered dermatology assistant.
"""

import httpx
from datetime import datetime
from app.config import settings

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """You are DermaScreen AI Assistant, a clinical dermatology and skin health expert chatbot.

Your role:
- Act as a knowledgeable health expert to explain skin conditions, symptoms, and scan reports in simple, patient-friendly terms.
- You will receive the user's latest scan image (or their attached image) as a visual input. Look at this image to evaluate the skin lesion, rash, or concern visually.
- Do NOT just list generic possibilities; instead, analyze the visual characteristics of the attached image (such as border irregularity, colors, symmetry, texture, and surrounding skin) combined with the classification result (Benign/Suspicious) and ABCDE notes from the context. Explain exactly what the photo shows and what specific condition it resembles (e.g. melanocytic mole, seborrheic keratosis, dermatofibroma, localized rash, fungal infection, etc.) based on your visual analysis of the image.
- For any suspected or identified skin issue, clearly explain what the problem is and clarify whether it is treatable/solvable.
- When explaining conditions that are treatable/manageable, suggest common over-the-counter (OTC) medicines (such as specific topical creams, hydrocortisone, anti-fungal ointments, moisturizers, or antihistamines), home remedies, and practical lifestyle or skincare management recommendations.
- If the user asks about skin problems, rashes, or infections (bacterial, viral, fungal), explain the typical symptoms, causes, and standard treatments or OTC solutions.
- Provide general skincare, sun protection, and dermatological education.

Important guidelines:
- While you suggest OTC options, remedies, and general medical knowledge as an expert, always include a disclaimer recommending that they consult a board-certified dermatologist for a formal diagnosis and prescription.
- Be empathetic, clear, and professional.
- Keep responses informative and well-structured, but concise (2-4 paragraphs max).
- Always remind users that DermaScreen is a screening support tool, not a replacement for a doctor.
"""


async def get_chat_response(message: str, history: list = None, context: str = None, image_url: str = None) -> str:
    """
    Send a message to OpenRouter and return the AI response.

    Args:
        message: The user's message
        history: Optional list of previous messages [{"sender": "user"|"assistant", "text": "..."}]
        context: Optional user scans context to ground the assistant
        image_url: Optional base64 or public image URL

    Returns:
        AI response text
    """
    if not settings.OPENROUTER_API_KEY or settings.OPENROUTER_API_KEY.startswith("#"):
        return _fallback_response(message)

    # Build messages array
    system_prompt = SYSTEM_PROMPT
    if context:
        system_prompt += f"\n{context}"

    messages = [{"role": "system", "content": system_prompt}]

    # Add conversation history (last 10 messages for context)
    if history:
        for msg in history[-10:]:
            role = "user" if msg.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": msg.get("text", "")})

    # Add current message (multimodal request if image_url is present)
    if image_url:
        if image_url.startswith("data:application/pdf"):
            pdf_note = "\n\n[System Note: The user has attached a clinical PDF report document. Explain to the user that while the application allows uploading PDF files, the AI vision model requires visual images (PNG/JPEG). Ask them to copy-paste the report text into the chat or upload a screenshot/image of it so you can analyze it for them.]"
            messages.append({"role": "user", "content": message + pdf_note})
        else:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "text", "text": message},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            })
    else:
        messages.append({"role": "user", "content": message})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
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
                    "max_tokens": 500,
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
                return "I apologize, but I couldn't generate a response. Please try again."

    except httpx.TimeoutException:
        return "I'm sorry, the response is taking too long. Please try again in a moment."
    except httpx.HTTPStatusError as e:
        print(f"[ERROR] OpenRouter API error: {e.response.status_code} - {e.response.text}")
        return _fallback_response(message)
    except Exception as e:
        print(f"[ERROR] Chat service error: {e}")
        return _fallback_response(message)


def _fallback_response(user_text: str) -> str:
    """Provide a basic response when OpenRouter is not configured or unavailable."""
    lower = user_text.lower()

    if "melanoma" in lower or "cancer" in lower:
        return (
            "If you're concerned about potential melanoma or skin cancer, please schedule "
            "an appointment with a dermatologist promptly. DermaScreen is a screening support "
            "tool, not a definitive diagnostic device. Early detection is key — the 5-year "
            "survival rate for early-stage melanoma is over 99%."
        )
    elif "scan" in lower or "result" in lower or "atypical" in lower:
        return (
            "Based on your scan results, I recommend sharing the detailed report with your "
            "healthcare provider for a physical skin examination. Our AI analysis provides "
            "a screening assessment, but a dermatologist can perform dermoscopy and biopsy "
            "if needed for definitive diagnosis."
        )
    elif "routine" in lower or "prevent" in lower or "sun" in lower:
        return (
            "To prevent UV-induced skin damage and lower skin cancer risk, dermatologists "
            "advise: applying broad-spectrum sunscreen (SPF 30+) daily, wearing protective "
            "hats and clothing, avoiding peak sun hours (10am-4pm), and performing monthly "
            "self-examinations using the ABCDE criteria (Asymmetry, Border, Color, Diameter, "
            "Evolution)."
        )
    else:
        return (
            "I understand your concern. Based on common dermatological guidelines, it's always "
            "best to keep track of any skin changes — particularly asymmetrical moles, jagged "
            "borders, color variations, or diameter growth (the ABCDEs of skin health). "
            "If you have specific questions about your scan results, feel free to ask!"
        )
