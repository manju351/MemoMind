"""Thin wrapper around the OpenAI-compat Gemini endpoint."""
import json
import re
from functools import lru_cache
from typing import Any

from openai import OpenAI

from .config import get_settings


@lru_cache
def _get_client() -> OpenAI:
    s = get_settings()
    if not s.llm_api_key:
        raise RuntimeError("LLM_API_KEY is not set")
    return OpenAI(api_key=s.llm_api_key, base_url=s.llm_base_url)


_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)\s*```", re.DOTALL)


def _extract_json_text(text: str) -> str:
    """Strip markdown fences if present; otherwise return as-is."""
    m = _FENCE_RE.search(text)
    return m.group(1).strip() if m else text.strip()


def chat_json(system: str, user: str, *, model: str | None = None, temperature: float = 0.4) -> Any:
    """Call Gemini and parse a JSON value (object or array) from the response."""
    s = get_settings()
    chosen_model = model or s.llm_model
    client = _get_client()

    resp = client.chat.completions.create(
        model=chosen_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    content = resp.choices[0].message.content or ""
    text = _extract_json_text(content)
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON from LLM: {exc}: {content[:300]!r}") from exc
