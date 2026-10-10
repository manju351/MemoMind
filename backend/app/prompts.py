"""Prompt templates for FlashForge."""
from .schemas import GenerateCardsRequest

_JSON_RULE = (
    "Respond with ONLY a single JSON object. No prose, no markdown fences, no comments."
)

_DIFFICULTY_NOTE = {
    "basic":   "Write cards a high-school student could understand. Prefer short, concrete answers.",
    "college": "Write cards at a university-course level. Use precise terminology.",
    "expert":  "Write cards for someone deeply studying the field. Probe nuance, edge cases, and reasoning.",
}


def generate_cards_prompt(req: GenerateCardsRequest) -> tuple[str, str]:
    diff_note = _DIFFICULTY_NOTE.get(req.difficulty, _DIFFICULTY_NOTE["college"])
    system = (
        "You are FlashForge, an expert tutor that converts study material into HIGH-QUALITY "
        "spaced-repetition flashcards. "
        "Each card must test ONE atomic fact, concept, or relationship. "
        "Avoid trivia, yes/no questions, and questions answerable from the front itself. "
        "Prefer questions that force recall ('Why...', 'How does X differ from Y?', 'What happens when...'). "
        f"{diff_note} "
        + _JSON_RULE
        + " The JSON object must have key `cards`: an array of objects with keys: "
        "front (string — the question/prompt), "
        "back (string — the answer, ideally 1-3 sentences), "
        "hint (string or null — optional gentle nudge if the card is tricky)."
    )
    topic = f"Topic focus: {req.topic_hint}\n" if req.topic_hint else ""
    user = (
        f"{topic}"
        f"Generate up to {req.num_cards} flashcards from the material below. "
        "Skip cards that would be too trivial. Quality over quantity.\n\n"
        f"Material:\n\"\"\"\n{req.text}\n\"\"\"\n"
    )
    return system, user
