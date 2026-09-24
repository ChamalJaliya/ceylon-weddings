"""
POST /ai/budget — generate a detailed LKR wedding budget estimate.

Uses gpt-4o-mini with JSON mode to return a structured budget breakdown
with per-category min/max ranges and practical notes.
"""

import json

from fastapi import APIRouter, HTTPException, Request

from ..config import settings
from ..schemas import (
    BudgetBreakdownLine,
    BudgetRequest,
    BudgetResponse,
    LkrRange,
)
from ..utils import complete_json, load_prompt

router = APIRouter(tags=["Budget"])

_BUDGET_PROMPT = load_prompt("budget.md")


def _build_budget_user_message(body: BudgetRequest) -> str:
    band_hint = f"Budget band hint: {body.budget_band}." if body.budget_band else ""
    return (
        f"Generate a detailed wedding budget estimate for:\n"
        f"- Traditions: {', '.join(body.traditions)}\n"
        f"- District: {body.district}\n"
        f"- Guest count: {body.guest_count}\n"
        f"{band_hint}\n\n"
        f"Return a JSON object matching the specified schema exactly."
    )


@router.post(
    "/budget",
    response_model=BudgetResponse,
    summary="Generate LKR budget estimate",
    description=(
        "Returns a detailed Sri Lankan wedding budget estimate in LKR, "
        "broken down by category with min/max ranges and practical notes. "
        "Tradition-specific line items (poruwa, nadaswaram, halal surcharge, etc.) "
        "are included automatically."
    ),
)
async def estimate_budget(request: Request, body: BudgetRequest) -> BudgetResponse:
    client = request.app.state.openai

    messages = [
        {"role": "system", "content": _BUDGET_PROMPT},
        {"role": "user", "content": _build_budget_user_message(body)},
    ]

    try:
        raw = await complete_json(client, settings.openai_structured_model, messages)
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from AI model: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    try:
        return BudgetResponse(
            total_lkr=LkrRange(**data["total_lkr"]),
            total_usd_approx=LkrRange(**data["total_usd_approx"]),
            disclaimer=data.get("disclaimer", ""),
            breakdown=[BudgetBreakdownLine(**line) for line in data.get("breakdown", [])],
        )
    except (KeyError, TypeError) as exc:
        raise HTTPException(status_code=502, detail=f"Unexpected AI response shape: {exc}") from exc
