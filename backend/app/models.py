from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel


class Deck(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    cards: list["Card"] = Relationship(back_populates="deck", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class Card(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    deck_id: int = Field(foreign_key="deck.id", index=True)
    front: str
    back: str
    hint: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # SM-2 lite spaced-repetition state
    interval_days: float = Field(default=0.0)      # current interval
    ease: float = Field(default=2.5)               # ease factor
    repetitions: int = Field(default=0)            # successful reviews in a row
    due_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    last_reviewed_at: Optional[datetime] = None
    review_count: int = Field(default=0)

    deck: Optional[Deck] = Relationship(back_populates="cards")
