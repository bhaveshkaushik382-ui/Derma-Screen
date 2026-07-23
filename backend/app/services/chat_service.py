"""
DermaScreen — Chat Service
Integrates with OpenRouter API for AI-powered dermatology assistant.
"""

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

SYSTEM_PROMPT = """You are DermaScreen AI Assistant, a clinical dermatology and skin health expert chatbot.

Your role:
- Act as a knowledgeable health expert to explain skin conditions, symptoms, and scan reports in simple, patient-friendly terms.
- When the user asks about their scan results, use the scan context data provided (condition, confidence, risk, clinical notes, ABCDE criteria) to give a thorough, specific analysis. Do NOT say "I can't see the image" — instead use the scan data provided in the context to explain the findings.
- For any identified condition, clearly explain:
  1. WHAT the condition is (name, description, what it looks like)
  2. WHETHER it is treatable/solvable
  3. HOW to treat it: suggest specific over-the-counter (OTC) medicines (topical creams, hydrocortisone, anti-fungal ointments, moisturizers, antihistamines, etc.), home remedies, and lifestyle/skincare recommendations
  4. WHEN to see a doctor — explain warning signs that require professional attention
- If the user asks "What does Suspicious mean?" — explain in clinical terms what a suspicious skin lesion finding means, the ABCDE criteria, what follow-up steps are recommended, and reassure the patient while being medically accurate.
- If the user asks "When should I see a dermatologist?" — provide a comprehensive, expert answer listing all situations (new/changing moles, persistent rashes, suspicious findings, family history, annual screenings, etc.)
- If the user asks about their report — analyze the scan context data, explain the condition found, its risk level, what the confidence score means, and provide actionable treatment recommendations.
- If the user asks about skin problems, rashes, or infections (bacterial, viral, fungal), explain the typical symptoms, causes, and standard treatments or OTC solutions.
- Provide general skincare, sun protection, and dermatological education.

Important guidelines:
- ALWAYS give a substantive, expert-level answer. Never refuse to answer or say you need more information if scan context is provided.
- While you suggest OTC options, remedies, and general medical knowledge as an expert, always include a disclaimer recommending that they consult a board-certified dermatologist for a formal diagnosis and prescription.
- Be empathetic, clear, and professional.
- Keep responses informative and well-structured (use bullet points or numbered lists for treatments), 2-4 paragraphs.
- Always remind users that DermaScreen is a screening support tool, not a replacement for a doctor.
"""


def _is_vision_capable() -> bool:
    """Check if the configured model supports multimodal (image) inputs."""
    model = settings.OPENROUTER_MODEL.lower()
    return any(m in model for m in VISION_CAPABLE_MODELS)


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

    # Check if current model supports vision
    vision_ok = _is_vision_capable()

    # Add current message
    if image_url and vision_ok:
        # Model supports vision — send multimodal request
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
    elif image_url and not vision_ok:
        # Model does NOT support vision — add a note so the AI uses scan context data instead
        image_note = "\n\n[System Note: The user's scan image is available but cannot be displayed to you. Use the scan context data provided in your system prompt to analyze and explain the findings. Do NOT tell the user you cannot see the image — just analyze using the scan data.]"
        messages.append({"role": "user", "content": message + image_note})
    else:
        messages.append({"role": "user", "content": message})

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
                    "max_tokens": 1200,
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
                print(f"[WARN] Empty response from OpenRouter. Data: {data}")
                return "I apologize, but I couldn't generate a response. Please try again."

    except httpx.TimeoutException:
        print("[ERROR] OpenRouter request timed out after 90s")
        return "I'm sorry, the response is taking too long. Please try again in a moment."
    except httpx.HTTPStatusError as e:
        error_body = e.response.text
        print(f"[ERROR] OpenRouter API error: {e.response.status_code} - {error_body}")
        # If it's a model error, provide more info
        if e.response.status_code == 400:
            return (
                "I encountered an issue processing your request. This may be due to the AI model configuration. "
                "Please try asking your question again, or contact support if the issue persists."
            )
        return _fallback_response(message)
    except Exception as e:
        print(f"[ERROR] Chat service error: {type(e).__name__}: {e}")
        return _fallback_response(message)


def _fallback_response(user_text: str) -> str:
    """Provide a basic response when OpenRouter is not configured or unavailable."""
    lower = user_text.lower()

    if "explain" in lower and ("report" in lower or "scan" in lower or "latest" in lower):
        return (
            "I'd love to help explain your scan report! Your DermaScreen analysis evaluates skin lesions "
            "using AI-powered image classification. The report includes:\n\n"
            "• **Condition**: The identified skin condition (e.g., Melanocytic Nevus, Benign Keratosis)\n"
            "• **Confidence**: How certain the AI is about its classification (higher is more reliable)\n"
            "• **Risk Level**: Low, Moderate, or High — based on the condition and ABCDE criteria\n"
            "• **Clinical Notes**: ABCDE assessment (Asymmetry, Border, Color, Diameter, Evolution)\n\n"
            "For a detailed AI-powered explanation, please ensure the backend AI service is properly configured. "
            "In the meantime, we recommend sharing your report with a board-certified dermatologist."
        )
    elif "suspicious" in lower:
        return (
            "A **'Suspicious'** finding in your DermaScreen report means the AI has detected features in your "
            "skin lesion that warrant closer medical attention. This does NOT automatically mean cancer, but it "
            "indicates the lesion shows one or more concerning characteristics based on the ABCDE criteria:\n\n"
            "• **A**symmetry — One half doesn't match the other\n"
            "• **B**order — Edges are irregular, ragged, or blurred\n"
            "• **C**olor — Multiple colors or uneven distribution\n"
            "• **D**iameter — Larger than 6mm (pencil eraser size)\n"
            "• **E**volution — The lesion is changing over time\n\n"
            "**Recommended next steps**: Schedule an appointment with a dermatologist for a clinical examination "
            "and possible dermoscopy. Many suspicious lesions turn out to be benign after professional evaluation."
        )
    elif "dermatologist" in lower or "doctor" in lower or "when should" in lower:
        return (
            "You should see a dermatologist in the following situations:\n\n"
            "1. **Suspicious scan results** — If DermaScreen flags a lesion as suspicious or high-risk\n"
            "2. **Changing moles** — Any mole that changes in size, shape, color, or starts bleeding/itching\n"
            "3. **New growths** — Any new skin growth that appears suddenly, especially after age 30\n"
            "4. **Persistent symptoms** — Rashes, itching, or skin irritation lasting more than 2 weeks\n"
            "5. **Family history** — If you have family history of melanoma or skin cancer\n"
            "6. **Annual screening** — Everyone should have an annual full-body skin check\n"
            "7. **Sun damage** — History of severe sunburns or excessive UV exposure\n\n"
            "**Don't delay** — early detection is crucial. The 5-year survival rate for early-stage melanoma "
            "is over 99%. DermaScreen is a screening tool to help prioritize, but it does not replace "
            "professional medical evaluation."
        )
    elif "melanoma" in lower or "cancer" in lower:
        return (
            "If you're concerned about potential melanoma or skin cancer, please schedule "
            "an appointment with a dermatologist promptly. DermaScreen is a screening support "
            "tool, not a definitive diagnostic device. Early detection is key — the 5-year "
            "survival rate for early-stage melanoma is over 99%."
        )
    elif "treatment" in lower or "treat" in lower or "medicine" in lower or "cream" in lower:
        return (
            "Treatment depends on the specific skin condition identified. Common approaches include:\n\n"
            "• **Benign moles**: Usually no treatment needed; monitor for changes\n"
            "• **Seborrheic keratosis**: Cryotherapy, curettage, or leave alone if not bothersome\n"
            "• **Dermatitis/Eczema**: Hydrocortisone cream (OTC), moisturizers, antihistamines\n"
            "• **Fungal infections**: Clotrimazole or terbinafine antifungal cream (OTC)\n"
            "• **Actinic keratosis**: Prescription fluorouracil cream, cryotherapy\n"
            "• **Suspicious lesions**: Surgical excision biopsy by a dermatologist\n\n"
            "For your specific condition, please share your scan results and I can provide "
            "more targeted recommendations. Always consult a dermatologist before starting treatment."
        )
    else:
        return (
            "I understand your concern. Based on common dermatological guidelines, it's always "
            "best to keep track of any skin changes — particularly asymmetrical moles, jagged "
            "borders, color variations, or diameter growth (the ABCDEs of skin health). "
            "If you have specific questions about your scan results, feel free to ask!"
        )
