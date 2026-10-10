import { useEffect, useState } from "react";
import { BookOpen, Layers, Loader2, Play, Trash2 } from "lucide-react";
import { api } from "../api";
import type { DeckSummary } from "../types";

interface Props {
  refreshKey: number;
  onStudy: (deckId: number) => void;
}

export default function DecksView({ refreshKey, onStudy }: Props) {
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const list = await api.listDecks();
      setDecks(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  async function remove(id: number) {
    if (!confirm("Delete this deck and all its cards?")) return;
    try {
      await api.deleteDeck(id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (decks === null) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading decks…
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <Layers className="mx-auto h-10 w-10 text-zinc-700 mb-3" />
        <p className="text-zinc-300 font-medium">No decks yet</p>
        <p className="text-sm text-zinc-500 mt-1">Head to <span className="text-indigo-400">Create</span> to forge your first deck.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((d) => (
          <article
            key={d.id}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-indigo-500/60 transition flex flex-col"
          >
            <header className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-zinc-100 truncate">{d.name}</h3>
                {d.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{d.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(d.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition"
                title="Delete deck"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </header>

            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <BookOpen className="h-3.5 w-3.5" /> {d.card_count} cards
              </span>
              <span className={`inline-flex items-center gap-1 ${d.due_count > 0 ? "text-amber-400" : "text-zinc-500"}`}>
                ● {d.due_count} due
              </span>
            </div>

            <button
              onClick={() => onStudy(d.id)}
              disabled={d.card_count === 0}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 px-3 py-2 text-sm font-medium transition"
            >
              <Play className="h-4 w-4" /> Study
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
