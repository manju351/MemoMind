import type {
  CardOut,
  CreateDeckRequest,
  DeckDetail,
  DeckSummary,
  GenerateCardsRequest,
  GenerateCardsResponse,
  HealthStatus,
  ReviewRating,
  ReviewResponse,
} from "./types";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => fetch("/health").then((r) => json<HealthStatus>(r)),

  generateCards: (req: GenerateCardsRequest) =>
    fetch("/api/cards/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }).then((r) => json<GenerateCardsResponse>(r)),

  createDeck: (req: CreateDeckRequest) =>
    fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    }).then((r) => json<DeckDetail>(r)),

  listDecks: () => fetch("/api/decks").then((r) => json<DeckSummary[]>(r)),

  getDeck: (id: number) => fetch(`/api/decks/${id}`).then((r) => json<DeckDetail>(r)),

  deleteDeck: (id: number) =>
    fetch(`/api/decks/${id}`, { method: "DELETE" }).then((r) => json<{ deleted: number }>(r)),

  getDue: (id: number) =>
    fetch(`/api/decks/${id}/due`).then((r) => json<CardOut[]>(r)),

  review: (cardId: number, rating: ReviewRating) =>
    fetch(`/api/cards/${cardId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    }).then((r) => json<ReviewResponse>(r)),
};
