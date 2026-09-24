"""Pydantic schemas shared across routers."""

from typing import Literal

from pydantic import BaseModel, Field


# ── Chat ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class WeddingProfile(BaseModel):
    """Partial wedding profile sent as context to the chat assistant."""
    traditions: list[str] = Field(default_factory=list, examples=[["kandyan", "western"]])
    district: str | None = Field(None, examples=["Colombo"])
    guest_count: int | None = Field(None, examples=[250])
    months_out: int | None = Field(None, examples=[10])
    is_diaspora: bool = False
    budget_band: str | None = Field(None, examples=["mid"])  # micro | mid | premium | luxury


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    wedding_profile: WeddingProfile | None = None


# ── Checklist ────────────────────────────────────────────────────────────────

class ChecklistRequest(BaseModel):
    traditions: list[str] = Field(..., examples=[["kandyan", "western"]])
    months_out: int = Field(..., ge=1, le=24, examples=[12])
    district: str = Field(..., examples=["Colombo"])
    guest_count: int = Field(..., ge=1, examples=[250])
    is_diaspora: bool = False


class ChecklistTask(BaseModel):
    title: str
    category: str
    months_before: int
    assignable_to: str
    notes: str = ""


class ChecklistResponse(BaseModel):
    tasks: list[ChecklistTask]


# ── Budget ───────────────────────────────────────────────────────────────────

class BudgetRequest(BaseModel):
    traditions: list[str] = Field(..., examples=[["kandyan"]])
    district: str = Field(..., examples=["Colombo"])
    guest_count: int = Field(..., ge=10, examples=[250])
    budget_band: str | None = Field(None, examples=["mid"])  # micro | mid | premium | luxury


class LkrRange(BaseModel):
    min: int
    max: int


class BudgetBreakdownLine(BaseModel):
    category: str
    min_lkr: int
    max_lkr: int
    pct_of_total: float
    notes: str = ""


class BudgetResponse(BaseModel):
    total_lkr: LkrRange
    total_usd_approx: LkrRange
    disclaimer: str
    breakdown: list[BudgetBreakdownLine]
