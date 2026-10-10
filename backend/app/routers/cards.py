"""Card generation endpoint (preview, no save)."""
from fastapi import APIRouter, HTTPException, status

from .. import llm
from ..config import get_settings
from ..prompts import generate_cards_prompt
from ..schemas import CardDraft, GenerateCardsRequest, GenerateCardsResponse

router = APIRouter()


@router.post("/cards/generate", response_model=GenerateCardsResponse, tags=["cards"])
def generate_cards(req: GenerateCardsRequest) -> GenerateCardsResponse:
    system, user = generate_cards_prompt(req)
    try:
        raw = llm.chat_json(system, user, model=get_settings().llm_model)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc

    raw_cards = raw.get("cards") if isinstance(raw, dict) else None
    if not isinstance(raw_cards, list):
        raise HTTPException(status_code=502, detail=f"LLM did not return a cards array: {raw!r}")

    cards: list[CardDraft] = []
    for c in raw_cards:
        if not isinstance(c, dict):
            continue
        front = (c.get("front") or "").strip()
        back = (c.get("back") or "").strip()
        if not front or not back:
            continue
        hint = (c.get("hint") or "").strip() or None
        cards.append(CardDraft(front=front, back=back, hint=hint))

    if not cards:
        raise HTTPException(status_code=502, detail="LLM returned no valid cards")
    return GenerateCardsResponse(cards=cards[: req.num_cards])
