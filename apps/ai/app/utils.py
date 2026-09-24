"""Shared utilities for loading prompt files and calling OpenAI."""

from pathlib import Path
from typing import AsyncIterator

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam


PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts/ directory."""
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


async def stream_chat(
    client: AsyncOpenAI,
    model: str,
    messages: list[ChatCompletionMessageParam],
) -> AsyncIterator[str]:
    """Yield text delta chunks from an OpenAI streaming chat completion."""
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=2048,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def complete_json(
    client: AsyncOpenAI,
    model: str,
    messages: list[ChatCompletionMessageParam],
) -> str:
    """Return a full JSON string from a non-streaming chat completion."""
    response = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=False,
        temperature=0.3,
        max_tokens=4096,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or "{}"
