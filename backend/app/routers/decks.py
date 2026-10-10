"""Deck CRUD + study endpoints."""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Card, Deck
from ..schemas import (
    CardOut,
    CreateDeckRequest,
    DeckDetail,
    DeckSummary,
    ReviewRequest,
    ReviewResponse,
)
from ..sm2 import schedule

router = APIRouter()


def _card_to_out(card: Card) -> CardOut:
    return CardOut(
        id=card.id,                       # type: ignore[arg-type]
        deck_id=card.deck_id,
        front=card.front,
        back=card.back,
        hint=card.hint,
        created_at=card.created_at,
        interval_days=card.interval_days,
        ease=card.ease,
        repetitions=card.repetitions,
        due_at=card.due_at,
        last_reviewed_at=card.last_reviewed_at,
        review_count=card.review_count,
    )


def _due_count(session: Session, deck_id: int, now: datetime) -> int:
    return len(
        list(
            session.exec(
                select(Card).where(Card.deck_id == deck_id).where(Card.due_at <= now)
            )
        )
    )


# ---------- Decks ----------
@router.post("/decks", response_model=DeckDetail, tags=["decks"])
def create_deck(req: CreateDeckRequest, session: Session = Depends(get_session)) -> DeckDetail:
    deck = Deck(name=req.name.strip(), description=(req.description or None))
    session.add(deck)
    session.commit()
    session.refresh(deck)

    for c in req.cards:
        front = c.front.strip()
        back = c.back.strip()
        if not front or not back:
            continue
        session.add(
            Card(
                deck_id=deck.id,  # type: ignore[arg-type]
                front=front,
                back=back,
                hint=(c.hint.strip() if c.hint else None),
            )
        )
    session.commit()
    session.refresh(deck)

    return _build_detail(session, deck)


@router.get("/decks", response_model=List[DeckSummary], tags=["decks"])
def list_decks(session: Session = Depends(get_session)) -> List[DeckSummary]:
    now = datetime.utcnow()
    decks = list(session.exec(select(Deck).order_by(Deck.created_at.desc())))
    out: List[DeckSummary] = []
    for d in decks:
        all_cards = list(session.exec(select(Card).where(Card.deck_id == d.id)))
        out.append(
            DeckSummary(
                id=d.id,  # type: ignore[arg-type]
                name=d.name,
                description=d.description,
                created_at=d.created_at,
                card_count=len(all_cards),
                due_count=sum(1 for c in all_cards if c.due_at <= now),
            )
        )
    return out


@router.get("/decks/{deck_id}", response_model=DeckDetail, tags=["decks"])
def get_deck(deck_id: int, session: Session = Depends(get_session)) -> DeckDetail:
    deck = session.get(Deck, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail=f"deck {deck_id} not found")
    return _build_detail(session, deck)


@router.delete("/decks/{deck_id}", tags=["decks"])
def delete_deck(deck_id: int, session: Session = Depends(get_session)) -> dict:
    deck = session.get(Deck, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail=f"deck {deck_id} not found")
    # delete cards explicitly (FK cascade not always enforced in SQLite)
    for card in list(session.exec(select(Card).where(Card.deck_id == deck_id))):
        session.delete(card)
    session.delete(deck)
    session.commit()
    return {"deleted": deck_id}


# ---------- Study ----------
@router.get("/decks/{deck_id}/due", response_model=List[CardOut], tags=["study"])
def list_due_cards(deck_id: int, session: Session = Depends(get_session)) -> List[CardOut]:
    deck = session.get(Deck, deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail=f"deck {deck_id} not found")
    now = datetime.utcnow()
    due = list(
        session.exec(
            select(Card)
            .where(Card.deck_id == deck_id)
            .where(Card.due_at <= now)
            .order_by(Card.due_at)
        )
    )
    return [_card_to_out(c) for c in due]


@router.post("/cards/{card_id}/review", response_model=ReviewResponse, tags=["study"])
def review_card(card_id: int, req: ReviewRequest, session: Session = Depends(get_session)) -> ReviewResponse:
    card = session.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail=f"card {card_id} not found")
    upd = schedule(
        rating=req.rating,
        repetitions=card.repetitions,
        interval_days=card.interval_days,
        ease=card.ease,
    )
    card.repetitions = upd["repetitions"]
    card.ease = upd["ease"]
    card.interval_days = upd["interval_days"]
    card.due_at = upd["due_at"]
    card.last_reviewed_at = upd["last_reviewed_at"]
    card.review_count += 1
    session.add(card)
    session.commit()
    session.refresh(card)
    return ReviewResponse(card=_card_to_out(card), next_due_at=card.due_at)


def _build_detail(session: Session, deck: Deck) -> DeckDetail:
    now = datetime.utcnow()
    cards = list(session.exec(select(Card).where(Card.deck_id == deck.id).order_by(Card.created_at)))
    return DeckDetail(
        id=deck.id,  # type: ignore[arg-type]
        name=deck.name,
        description=deck.description,
        created_at=deck.created_at,
        card_count=len(cards),
        due_count=sum(1 for c in cards if c.due_at <= now),
        cards=[_card_to_out(c) for c in cards],
    )
