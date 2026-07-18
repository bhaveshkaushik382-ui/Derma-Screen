"""
DermaScreen — Chat Router
Endpoint for AI-powered dermatology assistant via OpenRouter.
"""

import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.schemas.models import ChatRequest, ChatResponse, ChatMessage
from app.services import chat_service, supabase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.get("/history", response_model=List[ChatMessage])
async def get_chat_history(user: dict = Depends(get_current_user)):
    """
    Retrieve user's chat message history.
    """
    try:
        messages = supabase_service.get_chat_history(user["id"])
        chat_messages = []
        for msg in messages:
            created_at = msg.get("created_at")
            time_str = ""
            if created_at:
                try:
                    dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    time_str = dt.strftime("%I:%M %p")
                except Exception:
                    pass
            chat_messages.append(
                ChatMessage(
                    sender=msg.get("sender"),
                    text=msg.get("message"),
                    time=time_str,
                    user_name=msg.get("user_name")
                )
            )
        return chat_messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, user: dict = Depends(get_current_user)):
    """
    Send a message to the AI dermatology assistant.
    Accepts conversation history for context.
    Returns the AI response.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Fetch latest scans to ground the assistant with user context
    scan_context = ""
    try:
        latest_scans = supabase_service.get_user_scans(user["id"], limit=5)
        if latest_scans:
            latest_scan = latest_scans[0]
            scan_context = "\nBelow is context about the user's LATEST skin scan on file:\n"
            scan_context += (
                f"- LATEST SCAN DETAILS: Date={latest_scan.get('created_at')}, "
                f"Condition={latest_scan.get('condition')}, "
                f"Confidence={latest_scan.get('confidence')}%, "
                f"Risk={latest_scan.get('risk')}, "
                f"Clinical Notes={latest_scan.get('notes')}\n"
            )
            scan_context += "If the user asks about their latest scan, evaluate these LATEST SCAN DETAILS, explain the clinical condition/skin problem, explain whether it is treatable/solvable, and suggest appropriate OTC treatments or remedies based on your expert prompt instructions. Do not just state the confidence score.\n"
            
            if len(latest_scans) > 1:
                scan_context += "\nFor historical reference, here are older scans:\n"
                for idx, scan in enumerate(latest_scans[1:], 2):
                    scan_context += f"- Scan {idx} (Older): Date={scan.get('created_at')}, Condition={scan.get('condition')}, Confidence={scan.get('confidence')}%, Risk={scan.get('risk')}\n"
    except Exception as e:
        print(f"[WARN] Failed to fetch user scans for chat context: {e}")

    # Save user message to DB (with indication if image was attached)
    db_message = request.message
    if request.image_url:
        db_message = f"[Report Image Attached] {request.message}"

    try:
        supabase_service.save_chat_message(
            user_id=user["id"],
            sender="user",
            message=db_message,
            user_name=user.get("name", "User"),
        )
    except Exception as e:
        print(f"[WARN] Failed to save user message: {e}")

    # Convert history to the format expected by chat service
    history = []
    if request.history:
        history = [{"sender": m.sender, "text": m.text} for m in request.history]

    # Get AI response with context and image
    # Use user's manually attached image first; otherwise fall back to latest scan's image URL
    fallback_image = None
    if not request.image_url and latest_scans:
        fallback_image = latest_scan.get('image_url')

    response_text = await chat_service.get_chat_response(
        message=request.message,
        history=history,
        context=scan_context,
        image_url=request.image_url or fallback_image,
    )

    # Save assistant response to DB
    try:
        supabase_service.save_chat_message(
            user_id=user["id"],
            sender="assistant",
            message=response_text,
            user_name="AI Clinical Assistant",
        )
    except Exception as e:
        print(f"[WARN] Failed to save assistant message: {e}")

    now = datetime.now()
    time_str = now.strftime("%I:%M %p")

    return ChatResponse(
        id=int(time.time() * 1000),
        sender="assistant",
        text=response_text,
        time=time_str,
        user_name="AI Clinical Assistant",
    )


@router.delete("/history")
async def clear_chat_history(user: dict = Depends(get_current_user)):
    """
    Clear all chat messages for the current user.
    """
    try:
        supabase_service.delete_chat_history(user["id"])
        return {"status": "success", "message": "Chat history cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear chat history: {str(e)}")
