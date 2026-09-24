# Ceylon Weddings AI — Python FastAPI + OpenAI

AI microservice for Ceylon Weddings. Runs on `:8001`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `POST` | `/ai/chat` | Streaming SSE chat assistant (gpt-4o) |
| `POST` | `/ai/checklist` | Personalised task list, JSON (gpt-4o-mini) |
| `POST` | `/ai/budget` | LKR budget estimate, JSON (gpt-4o-mini) |

Interactive docs: `http://localhost:8001/docs`

## Setup

### Prerequisites
- Python 3.12+
- [`uv`](https://docs.astral.sh/uv/) (recommended) **or** plain pip

### With `uv` (recommended)

```bash
cd apps/ai
uv venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

### With pip

```bash
cd apps/ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment variables

Add these to the root `.env` (already picked up by `python-dotenv`):

```env
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o          # optional, default: gpt-4o
OPENAI_STRUCTURED_MODEL=gpt-4o-mini  # optional, default: gpt-4o-mini
NEST_API_URL=http://localhost:4000    # CORS allowlist
```

## Running locally

```bash
# From apps/ai (with venv activated)
uvicorn app:app --reload --port 8001

# Or from the monorepo root
pnpm ai:dev
```

## Running tests

```bash
cd apps/ai
pytest tests/ -v
```

## Architecture

```
apps/ai/
├── main.py              # uvicorn entrypoint
├── app/
│   ├── __init__.py      # FastAPI factory + lifespan
│   ├── config.py        # Pydantic settings
│   ├── schemas.py       # Request/response models
│   ├── utils.py         # OpenAI helpers (stream + JSON mode)
│   └── routers/
│       ├── chat.py      # POST /ai/chat   (SSE streaming)
│       ├── checklist.py # POST /ai/checklist
│       └── budget.py    # POST /ai/budget
├── prompts/
│   ├── system_chat.md   # Rich Sri Lankan wedding system prompt
│   ├── checklist.md     # Few-shot checklist generation prompt
│   └── budget.md        # LKR benchmark data + output schema
└── tests/
    └── test_routers.py  # Pytest unit tests (mocked OpenAI)
```

The NestJS API (`apps/api`) proxies all `/ai/*` requests to this service after authentication. The Next.js frontend never calls this service directly.
