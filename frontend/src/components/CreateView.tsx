import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { api } from "../api";
import type { CardDraft, Difficulty } from "../types";

interface Props {
  onSaved: (deckId: number) => void;
}

const DIFFICULTIES: Difficulty[] = ["basic", "college", "expert"];

export default function CreateView({ onSaved }: Props) {
  const [text, setText] = useState("");
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(8);
  const [difficulty, setDifficulty] = useState<Difficulty>("college");
  const [cards, setCards] = useState<CardDraft[]>([]);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deckName && topic) setDeckName(topic);
  }, [topic, deckName]);

  const canGenerate = useMemo(() => text.trim().length >= 30 && !loading, [text, loading]);
  const canSave = useMemo(() => cards.length > 0 && deckName.trim().length > 0 && !saving, [cards, deckName, saving]);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.generateCards({ text, topic: topic || undefined, num_cards: numCards, difficulty });
      setCards(res.cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const deck = await api.createDeck({
        name: deckName.trim(),
        description: deckDesc.trim() || undefined,
        cards,
      });
      onSaved(deck.id);
      setText("");
      setTopic("");
      setCards([]);
      setDeckName("");
      setDeckDesc("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function editCard(i: number, patch: Partial<CardDraft>) {
    setCards((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  function removeCard(i: number) {
    setCards((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">Forge a new deck</h2>
          <span className="text-xs text-zinc-500">Paste notes, slides, or any study material</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Topic (optional)</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. HTTP protocol"
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Cards: {numCards}</span>
              <input
                type="range"
                min={3}
                max={30}
                value={numCards}
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="mt-2 w-full accent-indigo-500"
              />
            </label>

            <div>
              <span className="text-xs uppercase tracking-wide text-zinc-400">Difficulty</span>
              <div className="mt-1 flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize transition ${
                      difficulty === d
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                        : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block h-full">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Source material</span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your study notes here (at least a few paragraphs work best)..."
                className="mt-1 w-full h-56 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm font-mono focus:border-indigo-500 outline-none resize-none"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">{text.length.toLocaleString()} chars</span>
          <button
            onClick={generate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2 text-sm font-medium transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate cards
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </section>

      {cards.length > 0 && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">
              Preview · {cards.length} cards
            </h2>
            <span className="text-xs text-zinc-500">Edit fronts/backs before saving</span>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((c, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>#{i + 1}</span>
                  <button
                    onClick={() => removeCard(i)}
                    className="text-zinc-500 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={c.front}
                  onChange={(e) => editCard(i, { front: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-800 pb-2 text-sm text-zinc-100 focus:border-indigo-500 outline-none resize-none"
                  rows={2}
                />
                <textarea
                  value={c.back}
                  onChange={(e) => editCard(i, { back: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-800 pb-2 text-sm text-zinc-300 focus:border-indigo-500 outline-none resize-none"
                  rows={3}
                />
                {c.hint && (
                  <p className="text-xs text-zinc-500 italic">💡 {c.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
            <input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Deck name"
              className="md:col-span-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
            />
            <input
              value={deckDesc}
              onChange={(e) => setDeckDesc(e.target.value)}
              placeholder="Description (optional)"
              className="md:col-span-1 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm focus:border-indigo-500 outline-none"
            />
            <button
              onClick={save}
              disabled={!canSave}
              className="md:col-span-1 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2 text-sm font-medium transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save deck
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
