import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AppHeader } from "@/components/AppHeader";
import { postCommuterReroute } from "@/lib/api";
import { toFriendlyError, type FriendlyError } from "@/lib/friendly-error";
import {
  AlertCircle,
  Camera,
  Loader2,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  Send,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/commuter")({
  head: () => ({
    meta: [
      { title: "Commuter · NaviMesh" },
      {
        name: "description",
        content:
          "Photograph a disruption and receive grounded, step-by-step reroutes from live news and transit telemetry.",
      },
    ],
  }),
  component: CommuterPage,
});

const CITY_HINTS = ["Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad"];

function CommuterPage() {
  const [city, setCity] = useState("");
  const [destination, setDestination] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function handlePickFile(f: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    if (!f) { setFile(null); setPreview(null); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function detectCity() {
    if (!navigator.geolocation) {
      setError({ title: "Location isn't available in this browser.", hint: "Type your city in the field instead." });
      return;
    }
    setGpsBusy(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const j = await r.json();
          const detected = j?.address?.city || j?.address?.town || j?.address?.state_district || j?.address?.state || "";
          if (detected) setCity(detected);
          else setError({ title: "Couldn't figure out your city.", hint: "Please type it in manually." });
        } catch {
          setError({ title: "Couldn't look up your city.", hint: "Please type it in manually." });
        } finally { setGpsBusy(false); }
      },
      () => {
        setError({ title: "Location access was blocked.", hint: "Allow location in your browser, or type your city in the field." });
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function submit() {
    if (!city || !destination || !file) {
      setError({ title: "A few things are still missing.", hint: "Please add a photo, your city, and a destination before continuing." });
      return;
    }
    setLoading(true); setError(null); setPlan(null);
    try {
      const res = await postCommuterReroute({ city, destination, file });
      setPlan(res.ai_reroute_plan);
    } catch (err) {
      setError(toFriendlyError(err));
    } finally { setLoading(false); }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 border-l-2 border-primary pl-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Platform_B2C · Citizen Portal
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Report a disruption.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Snap the platform, the crowd, or the intersection. NaviMesh cross-checks
            it against live civic data and returns two grounded reroutes.
          </p>
        </div>

        <form onSubmit={onSubmit} className="border border-border bg-surface p-6 shadow-sm">
          <Field label="01 · Scene photo">
            <div
              className="border border-dashed border-border-strong bg-surface-2 p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handlePickFile(f); }}
            >
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="uploaded scene" className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handlePickFile(null)}
                    className="absolute right-2 top-2 grid size-8 place-items-center border border-border bg-surface text-foreground"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Camera className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop a photo, or capture one now
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-foreground px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-background transition-colors hover:bg-foreground/85"
                    >
                      <Upload className="size-3.5" /> Choose file
                    </button>
                    <label className="inline-flex cursor-pointer items-center gap-2 border border-border bg-surface px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-2">
                      <Camera className="size-3.5" /> Camera
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)} />
                    </label>
                  </div>
                </div>
              )}
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)} />
            </div>
          </Field>

          <Field label="02 · City">
            <div className="flex gap-2">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Delhi"
                className="flex-1 border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
              />
              <button
                type="button"
                onClick={detectCity}
                disabled={gpsBusy}
                className="inline-flex items-center gap-2 border border-border bg-surface px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                {gpsBusy ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
                Detect
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CITY_HINTS.map((c) => (
                <button type="button" key={c} onClick={() => setCity(c)}
                  className="border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
                  {c}
                </button>
              ))}
            </div>
          </Field>

          <Field label="03 · Destination">
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where are you trying to reach?"
              className="w-full border border-input bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary"
            />
          </Field>

          {error && <ErrorBlock error={error} onRetry={loading ? undefined : submit} />}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 bg-foreground px-4 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-background transition-colors hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (<><Loader2 className="size-4 animate-spin" /> Reading the scene…</>)
              : (<><Send className="size-3.5" /> Get reroute plan</>)}
          </button>
        </form>

        {plan && <RoutePlan markdown={plan} destination={destination} city={city} />}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
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

// Presents the AI reroute plan as a structured, human-readable card.
// The backend returns freeform markdown; we render it with tightened
// typography that matches the civic aesthetic instead of relying on
// generic prose styles. If the plan happens to contain multiple numbered
// options (e.g. "Option 1", "Option 2"), we split them into side-by-side
// panels for easier comparison.
function RoutePlan({ markdown, destination, city }: { markdown: string; destination: string; city: string }) {
  const sections = useMemo(() => splitOptions(markdown), [markdown]);

  return (
    <section className="mt-8 border border-primary/40 bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-5 py-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="size-4 text-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Reroute plan
          </p>
        </div>
        {(city || destination) && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {city}{city && destination ? " → " : ""}{destination}
          </p>
        )}
      </header>

      <div className={sections.length > 1 ? "grid gap-px bg-border sm:grid-cols-2" : ""}>
        {sections.map((s, i) => (
          <div key={i} className="bg-surface p-5">
            {s.title && (
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
                {s.title}
              </p>
            )}
            <MarkdownBody text={s.body} />
          </div>
        ))}
      </div>
    </section>
  );
}

function MarkdownBody({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground">
      <ReactMarkdown
        components={{
          h1: (props) => <h3 className="font-display text-lg font-semibold text-foreground" {...props} />,
          h2: (props) => <h3 className="font-display text-lg font-semibold text-foreground" {...props} />,
          h3: (props) => <h4 className="font-display text-base font-semibold text-foreground" {...props} />,
          p: (props) => <p className="text-[15px] leading-relaxed text-foreground" {...props} />,
          strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-1 pl-5 marker:text-muted-foreground" {...props} />,
          li: (props) => <li className="text-[15px] leading-relaxed text-foreground" {...props} />,
          a: (props) => <a className="text-primary underline underline-offset-2 hover:no-underline" target="_blank" rel="noreferrer" {...props} />,
          code: (props) => <code className="border border-border bg-surface-2 px-1 py-0.5 font-mono text-[12px]" {...props} />,
          hr: () => <hr className="my-3 border-border" />,
        }}
      >
        {cleanMarkdown(text)}
      </ReactMarkdown>
    </div>
  );
}

// Normalize backend text: decode common HTML entities, collapse excessive
// blank lines, and trim trailing whitespace so the output reads cleanly.
function cleanMarkdown(t: string): string {
  return decodeEntities(t).replace(/\n{3,}/g, "\n\n").trim();
}

function decodeEntities(t: string): string {
  return t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\u00a0/g, " ");
}

// Split "Option 1 / Option 2 / Route A / Route B" blocks into panels.
// Falls back to a single panel when no such headings exist.
function splitOptions(md: string): { title: string | null; body: string }[] {
  const cleaned = cleanMarkdown(md);
  const re = /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*(Option\s*\d+|Route\s*[A-Z0-9]+|Plan\s*[A-Z0-9]+)\b[^\n]*$/gim;
  const matches = [...cleaned.matchAll(re)];
  if (matches.length < 2) return [{ title: null, body: cleaned }];

  const parts: { title: string | null; body: string }[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index ?? 0;
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? cleaned.length) : cleaned.length;
    const slice = cleaned.slice(start, end);
    const firstLineEnd = slice.indexOf("\n");
    const rawTitle = (firstLineEnd === -1 ? slice : slice.slice(0, firstLineEnd))
      .replace(/[#*]/g, "")
      .trim();
    const body = (firstLineEnd === -1 ? "" : slice.slice(firstLineEnd + 1)).trim();
    parts.push({ title: rawTitle, body });
  }
  return parts;
}
