import { useEffect, useState } from "react";
import { Flame, Layers, Sparkles } from "lucide-react";
import CreateView from "./components/CreateView";
import DecksView from "./components/DecksView";
import StudyView from "./components/StudyView";
import { api } from "./api";

type Tab = "create" | "decks";

export default function App() {
  const [tab, setTab] = useState<Tab>("create");
  const [studyDeck, setStudyDeck] = useState<number | null>(null);
  const [deckBust, setDeckBust] = useState(0);
  const [health, setHealth] = useState<{ ok: boolean; model?: string }>({ ok: false });

  useEffect(() => {
    api
      .health()
      .then((h) => setHealth({ ok: true, model: h.model }))
      .catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="min-h-full">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h1 className="text-lg font-semibold text-zinc-100">
              Flash<span className="text-orange-500">Forge</span>
            </h1>
            <span className="text-xs text-zinc-500 hidden sm:inline">AI-powered spaced-repetition flashcards</span>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => {
                setStudyDeck(null);
                setTab("create");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                tab === "create" && studyDeck === null
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Sparkles className="h-4 w-4" /> Create
            </button>
            <button
              onClick={() => {
                setStudyDeck(null);
                setTab("decks");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                tab === "decks" && studyDeck === null
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Layers className="h-4 w-4" /> Decks
            </button>

            <span
              className={`ml-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
                health.ok
                  ? "border-emerald-700/50 bg-emerald-900/20 text-emerald-400"
                  : "border-red-700/50 bg-red-900/20 text-red-400"
              }`}
              title={health.model ?? ""}
            >
              ● {health.ok ? "live" : "offline"}
            </span>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {studyDeck !== null ? (
          <StudyView deckId={studyDeck} onBack={() => setStudyDeck(null)} />
        ) : tab === "create" ? (
          <CreateView
            onSaved={(id) => {
              setDeckBust((n) => n + 1);
              setTab("decks");
              setStudyDeck(id);
            }}
          />
        ) : (
          <DecksView
            refreshKey={deckBust}
            onStudy={(id) => setStudyDeck(id)}
          />
        )}
      </main>
    </div>
  );
}
