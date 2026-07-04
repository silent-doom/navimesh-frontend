import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppHeader } from "@/components/AppHeader";
import { postLiveRAG, postTextToSQL, type SQLResponse, type RAGResponse } from "@/lib/api";
import { toFriendlyError, type FriendlyError } from "@/lib/friendly-error";
import {
  AlertCircle,
  Database,
  Loader2,
  MessageSquare,
  Play,
  Radio,
  RefreshCw,
  Sparkles,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "City Planner · NaviMesh" },
      {
        name: "description",
        content:
          "Text-to-SQL over the transit warehouse and live RAG over real-time civic news, built for city planners.",
      },
    ],
  }),
  component: PlannerPage,
});

type Tab = "sql" | "rag";

function PlannerPage() {
  const [tab, setTab] = useState<Tab>("sql");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-l-2 border-signal pl-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">
              Platform_B2B · Civic Planner
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Planner console.
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Two grounded interfaces — one for the warehouse, one for the street.
              Ask in plain English, get answers you can act on.
            </p>
          </div>

          <div className="inline-flex border border-border bg-surface p-1">
            <TabButton active={tab === "sql"} onClick={() => setTab("sql")}>
              <Database className="size-3.5" /> Text-to-SQL
            </TabButton>
            <TabButton active={tab === "rag"} onClick={() => setTab("rag")}>
              <Radio className="size-3.5" /> Live RAG
            </TabButton>
          </div>
        </div>

        {tab === "sql" ? <SQLPanel /> : <RAGPanel />}
      </main>
    </div>
  );
}

function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
        active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ErrorBlock({ error, onRetry }: { error: FriendlyError; onRetry?: () => void }) {
  return (
    <div className="mt-4 border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{error.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{error.hint}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 border border-border bg-surface px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-2"
            >
              <RefreshCw className="size-3" /> Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SQL_EXAMPLES = [
  "Average peak delay per route in rainy weather",
  "Top 5 busiest routes last month",
  "Which bus routes had delays over 15 minutes?",
];

function SQLPanel() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [result, setResult] = useState<SQLResponse | null>(null);

  async function run(q?: string) {
    const finalQ = q ?? query;
    if (!finalQ.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await postTextToSQL(finalQ);
      setResult(r);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="min-w-0 border border-border bg-surface p-6">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          01 · Ask the warehouse
        </p>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="Show me routes with the worst on-time performance during monsoon…"
          className="w-full resize-none border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SQL_EXAMPLES.map((s) => (
            <button key={s} onClick={() => { setQuery(s); run(s); }}
              className="border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              {s}
            </button>
          ))}
        </div>

        {error && <ErrorBlock error={error} onRetry={loading ? undefined : () => run()} />}

        <button
          onClick={() => run()}
          disabled={loading || !query.trim()}
          className="mt-4 inline-flex items-center gap-3 bg-foreground px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (<><Loader2 className="size-3.5 animate-spin" /> Reasoning…</>)
            : (<><Play className="size-3.5" /> Run</>)}
        </button>

        {result && (
          <div className="mt-6 space-y-5">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <Terminal className="size-3" /> Generated SQL
              </p>
              <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-foreground">
                {result.generated_sql}
              </pre>
            </div>
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
                <Sparkles className="size-3" /> Executive insight
              </p>
              <div className="border border-primary/30 bg-primary-soft p-3 text-sm text-foreground">
                <div className="prose prose-sm max-w-none break-words prose-strong:text-foreground">
                  <ReactMarkdown>{cleanText(result.executive_insight)}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0 border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            02 · Results
          </p>
          {result && (
            <span className="border border-signal/40 bg-signal-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal">
              {result.data.length} rows
            </span>
          )}
        </div>

        {!result && !loading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center">
            <Database className="size-6 text-muted-foreground/60" />
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Awaiting query
            </p>
          </div>
        )}
        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            Translating to SQL and querying…
          </div>
        )}
        {result && result.data.length > 0 && <ResultsTable rows={result.data} />}
        {result && result.data.length === 0 && (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Query returned no rows.
          </p>
        )}
      </div>
    </div>
  );
}

function ResultsTable({ rows }: { rows: Record<string, unknown>[] }) {
  const cols = Object.keys(rows[0] ?? {});
  return (
    <div className="mt-4 max-w-full overflow-x-auto border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2">
          <tr>
            {cols.map((c) => (
              <th key={c} className="border-b border-border px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-surface even:bg-surface-2/40">
              {cols.map((c) => (
                <td key={c} className="border-b border-border/60 px-3 py-2 font-mono text-xs text-foreground">
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --- RAG --- */
function RAGPanel() {
  const [city, setCity] = useState("Delhi");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [result, setResult] = useState<RAGResponse | null>(null);

  async function run() {
    if (!city.trim() || !query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await postLiveRAG(city, query);
      setResult(r);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="min-w-0 border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              01 · City
            </p>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              02 · Planner query
            </p>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Any flooding or transit strikes right now?"
              className="w-full border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
            />
          </div>
        </div>

        {error && <ErrorBlock error={error} onRetry={loading ? undefined : run} />}

        <button
          onClick={run}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-3 bg-foreground px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (<><Loader2 className="size-3.5 animate-spin" /> Scraping · embedding · retrieving…</>)
            : (<><MessageSquare className="size-3.5" /> Ask live sources</>)}
        </button>

        {result && (
          <div className="mt-6 min-w-0">
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
              <Sparkles className="size-3" /> Synthesized answer · {result.city_monitored}
            </p>
            <div className="border border-primary/30 bg-primary-soft p-4">
              <div className="prose prose-sm max-w-none break-words prose-headings:font-display prose-strong:text-foreground">
                <ReactMarkdown>{cleanText(result.ai_response)}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0 border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            03 · Sources we pulled
          </p>
          {result && (
            <span
              title="How closely the retrieved sources match your question (0–100%)."
              className="inline-flex items-center gap-1.5 border border-signal/40 bg-signal-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-signal"
            >
              <Radio className="size-3" /> Source match {formatConfidence(result.vector_confidence_score)}
            </span>
          )}
        </div>

        {!result && !loading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-center">
            <Radio className="size-6 text-muted-foreground/60" />
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Awaiting query
            </p>
          </div>
        )}
        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" />
            Fetching real-time civic reports…
          </div>
        )}
        {result && (
          <div className="mt-4 max-h-[420px] max-w-full overflow-auto border border-border bg-surface-2 p-4">
            <div className="prose prose-sm max-w-none break-words text-foreground prose-strong:text-foreground prose-a:text-primary">
              <ReactMarkdown>{cleanText(result.retrieved_source_document)}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Decode common HTML entities the scraper may leave in place and collapse
// runs of blank lines so the panel reads like prose, not a data dump.
function cleanText(t: string): string {
  if (!t) return "";
  return t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      try { return String.fromCodePoint(parseInt(n, 10)); } catch { return " "; }
    })
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Score arrives as a 0–1 similarity value; show it as a friendly percentage.
function formatConfidence(score: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return `${pct}%`;
}
