"""
POST /ai/checklist — generate a personalised wedding planning checklist.

Uses gpt-4o-mini with JSON mode to return a structured list of tasks
tailored to the couple's traditions, location, and timeline.
"""

import json

from fastapi import APIRouter, HTTPException, Request

from ..config import settings
from ..schemas import ChecklistRequest, ChecklistResponse, ChecklistTask
from ..utils import complete_json, load_prompt

router = APIRouter(tags=["Checklist"])

_CHECKLIST_PROMPT = load_prompt("checklist.md")


def _build_checklist_user_message(body: ChecklistRequest) -> str:
    return (
        f"Generate a wedding planning checklist for the following profile:\n"
        f"- Traditions: {', '.join(body.traditions)}\n"
        f"- Months until wedding: {body.months_out}\n"
        f"- District: {body.district}\n"
        f"- Expected guest count: {body.guest_count}\n"
        f"- Planning from overseas: {'Yes' if body.is_diaspora else 'No'}\n\n"
        f"Return a JSON object with a single key `tasks` containing an array of task objects."
    )


@router.post(
    "/checklist",
    response_model=ChecklistResponse,
    summary="Generate personalised checklist",
    description=(
        "Generates a culturally-appropriate wedding planning checklist based on "
        "the couple's traditions (Kandyan, Western, Hindu, Muslim, etc.), "
        "months until the wedding, district, and guest count."
    ),
)
async def generate_checklist(request: Request, body: ChecklistRequest) -> ChecklistResponse:
    client = request.app.state.openai

    messages = [
        {"role": "system", "content": _CHECKLIST_PROMPT},
        {"role": "user", "content": _build_checklist_user_message(body)},
    ]

    try:
        raw = await complete_json(client, settings.openai_structured_model, messages)
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail=f"Invalid JSON from AI model: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI service error: {exc}") from exc

    tasks_raw = data.get("tasks", [])
    if not isinstance(tasks_raw, list):
        raise HTTPException(status_code=502, detail="Unexpected AI response shape: 'tasks' is not a list")

    tasks = [ChecklistTask(**t) for t in tasks_raw]

    # Sort by months_before descending (furthest first)
    tasks.sort(key=lambda t: t.months_before, reverse=True)

    return ChecklistResponse(tasks=tasks)
