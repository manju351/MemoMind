import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "../api";
import type { CardOut, DeckDetail, ReviewRating } from "../types";

interface Props {
  deckId: number;
  onBack: () => void;
}

const RATINGS: { rating: ReviewRating; label: string; key: string; color: string }[] = [
  { rating: "again", label: "Again", key: "1", color: "bg-red-600 hover:bg-red-500" },
  { rating: "hard", label: "Hard", key: "2", color: "bg-amber-600 hover:bg-amber-500" },
  { rating: "good", label: "Good", key: "3", color: "bg-emerald-600 hover:bg-emerald-500" },
  { rating: "easy", label: "Easy", key: "4", color: "bg-indigo-600 hover:bg-indigo-500" },
];

export default function StudyView({ deckId, onBack }: Props) {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [queue, setQueue] = useState<CardOut[]>([]);
  const [reviewed, setReviewed] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [d, due] = await Promise.all([api.getDeck(deckId), api.getDue(deckId)]);
      setDeck(d);
      setQueue(due);
      setReviewed(0);
      setFlipped(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const current = queue[0];

  const grade = useCallback(
    async (rating: ReviewRating) => {
      if (!current || submitting) return;
      setSubmitting(true);
      try {
        await api.review(current.id, rating);
        setQueue((prev) => prev.slice(1));
        setReviewed((n) => n + 1);
        setFlipped(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSubmitting(false);
      }
    },
    [current, submitting],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      const hit = RATINGS.find((r) => r.key === e.key);
      if (hit) grade(hit.rating);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, grade]);

  const total = useMemo(() => queue.length + reviewed, [queue.length, reviewed]);
  const progress = total === 0 ? 0 : Math.round((reviewed / total) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading study session…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to decks
        </button>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-zinc-100">{deck?.name}</h2>
          <p className="text-xs text-zinc-500">
            {reviewed} reviewed · {queue.length} due remaining
          </p>
        </div>
      </header>

      <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!current ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <p className="text-zinc-100 font-semibold text-lg">All caught up!</p>
          <p className="text-sm text-zinc-500 mt-1">
            {reviewed > 0
              ? `You reviewed ${reviewed} cards. Come back later for more.`
              : "Nothing is due right now. Add more cards or wait for upcoming reviews."}
          </p>
          <button
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-medium"
          >
            Back to decks
          </button>
        </div>
      ) : (
        <>
          <div
            className={`flip-card mx-auto w-full max-w-2xl h-72 cursor-pointer ${flipped ? "flipped" : ""}`}
            onClick={() => setFlipped((f) => !f)}
          >
            <div className="flip-card-inner">
              <div className="flip-card-face rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Question</span>
                <p className="text-xl text-zinc-100 whitespace-pre-wrap">{current.front}</p>
                {current.hint && (
                  <p className="text-xs text-zinc-500 mt-4 italic">💡 {current.hint}</p>
                )}
                <span className="text-xs text-zinc-600 mt-6">Click or press space to reveal</span>
              </div>
              <div className="flip-card-face flip-card-back rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-indigo-950/40 to-zinc-950 p-8 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase tracking-widest text-indigo-400 mb-3">Answer</span>
                <p className="text-lg text-zinc-100 whitespace-pre-wrap">{current.back}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
            {RATINGS.map((r) => (
              <button
                key={r.rating}
                onClick={() => grade(r.rating)}
                disabled={!flipped || submitting}
                className={`rounded-lg px-3 py-3 text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed ${r.color}`}
              >
                <span className="block">{r.label}</span>
                <span className="block text-[10px] font-mono opacity-70 mt-0.5">[{r.key}]</span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-zinc-500">
            Tip: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Space</kbd> to flip ·{" "}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">1-4</kbd> to grade
          </p>
        </>
      )}
    </div>
  );
}
