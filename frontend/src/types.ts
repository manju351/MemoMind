export type Difficulty = "basic" | "college" | "expert";
export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface CardDraft {
  front: string;
  back: string;
  hint?: string | null;
}

export interface GenerateCardsRequest {
  text: string;
  topic?: string;
  num_cards?: number;
  difficulty?: Difficulty;
}

export interface GenerateCardsResponse {
  cards: CardDraft[];
}

export interface CreateDeckRequest {
  name: string;
  description?: string;
  cards: CardDraft[];
}

export interface CardOut {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  hint?: string | null;
  created_at: string;
  interval_days: number;
  ease: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at?: string | null;
  review_count: number;
}

export interface DeckSummary {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  card_count: number;
  due_count: number;
}

export interface DeckDetail extends DeckSummary {
  cards: CardOut[];
}

export interface ReviewResponse {
  card: CardOut;
  next_due_at: string;
}

export interface HealthStatus {
  status: string;
  model: string;
  base_url: string;
}
