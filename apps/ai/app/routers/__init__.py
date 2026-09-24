from .chat import router as chat_router
from .checklist import router as checklist_router
from .budget import router as budget_router

chat = type("_M", (), {"router": chat_router})()
checklist = type("_M", (), {"router": checklist_router})()
budget = type("_M", (), {"router": budget_router})()

__all__ = ["chat", "checklist", "budget"]
