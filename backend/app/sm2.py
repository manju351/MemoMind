"""SM-2 lite spaced-repetition scheduler.

Lighter variant of SuperMemo SM-2 with 4 rating buttons (Anki-style):
  - again  → reset to 0 reps, short interval (10 min), ease -= 0.20 (min 1.3)
  - hard   → keep reps, interval *= 1.2, ease -= 0.15 (min 1.3)
  - good   → interval based on reps, ease unchanged
  - easy   → interval based on reps with 1.3× boost, ease += 0.10

Returns updated card fields. Mutates nothing.
"""
from datetime import datetime, timedelta
from typing import Literal

ReviewRating = Literal["again", "hard", "good", "easy"]

MIN_EASE = 1.3
AGAIN_INTERVAL_MINUTES = 10


def schedule(
    *,
    rating: ReviewRating,
    repetitions: int,
    interval_days: float,
    ease: float,
    now: datetime | None = None,
) -> dict:
    now = now or datetime.utcnow()
    new_ease = ease
    new_reps = repetitions

    if rating == "again":
        new_reps = 0
        new_ease = max(MIN_EASE, ease - 0.20)
        new_interval = AGAIN_INTERVAL_MINUTES / (60 * 24)  # ~10 min in days
        new_due = now + timedelta(minutes=AGAIN_INTERVAL_MINUTES)
    elif rating == "hard":
        new_ease = max(MIN_EASE, ease - 0.15)
        new_interval = max(0.25, interval_days * 1.2)  # at least 6h
        new_due = now + timedelta(days=new_interval)
    elif rating == "good":
        new_reps = repetitions + 1
        if new_reps == 1:
            new_interval = 1.0
        elif new_reps == 2:
            new_interval = 3.0
        else:
            new_interval = max(1.0, interval_days * ease)
        new_due = now + timedelta(days=new_interval)
    else:  # easy
        new_reps = repetitions + 1
        new_ease = ease + 0.10
        if new_reps == 1:
            new_interval = 2.0
        elif new_reps == 2:
            new_interval = 5.0
        else:
            new_interval = max(1.0, interval_days * ease * 1.3)
        new_due = now + timedelta(days=new_interval)

    return {
        "repetitions": new_reps,
        "ease": round(new_ease, 3),
        "interval_days": round(new_interval, 3),
        "due_at": new_due,
        "last_reviewed_at": now,
    }
