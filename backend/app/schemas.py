from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------- Cards ----------
Difficulty = Literal["basic", "college", "expert"]
ReviewRating = Literal["again", "hard", "good", "easy"]


class CardDraft(BaseModel):
    """A generated card not yet persisted."""
    front: str
    back: str
    hint: Optional[str] = None


class GenerateCardsRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Source notes to turn into cards")
    num_cards: int = Field(default=10, ge=1, le=40)
    difficulty: Difficulty = "college"
    topic_hint: Optional[str] = Field(default=None, description="Optional topic to anchor the cards on")


class GenerateCardsResponse(BaseModel):
    cards: List[CardDraft]


# ---------- Decks ----------
class CreateDeckRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    cards: List[CardDraft] = Field(default_factory=list)


class CardOut(BaseModel):
    id: int
    deck_id: int
    front: str
    back: str
    hint: Optional[str]
    created_at: datetime
    interval_days: float
    ease: float
    repetitions: int
    due_at: datetime
    last_reviewed_at: Optional[datetime]
    review_count: int


class DeckSummary(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    card_count: int
    due_count: int


class DeckDetail(DeckSummary):
    cards: List[CardOut]


# ---------- Reviews ----------
class ReviewRequest(BaseModel):
    rating: ReviewRating


class ReviewResponse(BaseModel):
    card: CardOut
    next_due_at: datetime
