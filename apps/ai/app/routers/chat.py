"""
POST /ai/chat — streaming SSE wedding planning chat assistant.

Streams text/event-stream back so the NestJS proxy can pipe it directly
to the browser using Server-Sent Events.
"""

import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from ..schemas import ChatRequest, WeddingProfile
from ..utils import load_prompt, stream_chat
from ..config import settings

router = APIRouter(tags=["Chat"])

_SYSTEM_PROMPT = load_prompt("system_chat.md")


def _build_system_message(profile: WeddingProfile | None) -> str:
    """Append wedding profile context to the base system prompt."""
    if not profile:
        return _SYSTEM_PROMPT

    ctx_parts = [_SYSTEM_PROMPT, "\n\n## Current couple's wedding profile\n"]

    if profile.traditions:
        ctx_parts.append(f"- **Traditions**: {', '.join(profile.traditions)}")
    if profile.district:
        ctx_parts.append(f"- **District**: {profile.district}")
    if profile.guest_count:
        ctx_parts.append(f"- **Guest count**: {profile.guest_count}")
    if profile.months_out:
        ctx_parts.append(f"- **Months until wedding**: {profile.months_out}")
    if profile.budget_band:
        ctx_parts.append(f"- **Budget band**: {profile.budget_band}")
    ctx_parts.append(f"- **Planning from overseas**: {'Yes' if profile.is_diaspora else 'No'}")

    return "\n".join(ctx_parts)


async def _sse_generator(request: Request, body: ChatRequest):
    """Yield SSE-formatted chunks from OpenAI stream."""
    client = request.app.state.openai
    system_msg = _build_system_message(body.wedding_profile)

    messages = [{"role": "system", "content": system_msg}]
    for msg in body.messages:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        async for chunk in stream_chat(client, settings.openai_chat_model, messages):
            yield f"data: {json.dumps({'delta': chunk})}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


@router.post(
    "/chat",
    summary="Streaming chat assistant",
    description=(
        "Streams a culturally-aware Sri Lankan wedding planning response as "
        "Server-Sent Events. Each event carries `{delta: string}`. "
        "The stream ends with `data: [DONE]`."
    ),
    response_description="text/event-stream of SSE chunks",
)
async def chat(request: Request, body: ChatRequest):
    return StreamingResponse(
        _sse_generator(request, body),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )
