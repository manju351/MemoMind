# FlashForge

> Paste your notes — get AI-generated spaced-repetition flashcards.

FlashForge turns any text (lecture notes, textbook chapters, blog posts) into a
deck of high-quality flashcards using Google Gemini, then drills you on them
with an SM-2-style spaced-repetition study mode.

## Stack
- **Backend:** FastAPI · SQLModel · SQLite · Google Gemini (OpenAI-compat API)
- **Frontend:** Vite · React · TypeScript · Tailwind CSS
- **Tests:** pytest

## Quick start

### 1. Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
cp .env.example .env             # then set LLM_API_KEY
uvicorn app.main:app --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features
- **Generate:** Paste any text, choose how many cards and a difficulty (basic / college / expert), and let Gemini draft cards with front/back/optional hint.
- **Decks:** Save generated cards as a named deck. Browse all decks with stats.
- **Study:** Spaced-repetition study mode (SM-2 lite). Rate each card *Again / Hard / Good / Easy* — the next review interval adjusts automatically.

## API
| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/cards/generate` | Generate cards from text (preview, no save) |
| `POST` | `/api/decks` | Save a deck with cards |
| `GET`  | `/api/decks` | List all decks with counts |
| `GET`  | `/api/decks/{id}` | Get deck + all cards |
| `DELETE` | `/api/decks/{id}` | Delete a deck |
| `GET`  | `/api/decks/{id}/due` | Get cards due for review now |
| `POST` | `/api/cards/{id}/review` | Record a review (rating: again/hard/good/easy) |

## License
MIT
