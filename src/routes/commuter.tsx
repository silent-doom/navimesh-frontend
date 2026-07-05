import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { postCommuterReroute, type CommuterReroutePlan, type RouteStep } from "@/lib/api";
import { toFriendlyError, type FriendlyError } from "@/lib/friendly-error";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Car,
  Footprints,
  Loader2,
  MapPin,
  RefreshCw,
  Route as RouteIcon,
  Send,
  Train,
  Bus,
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
  const [plan, setPlan] = useState<CommuterReroutePlan | null>(null);
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

        {plan && <RoutePlan plan={plan} destination={destination} city={city} />}
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

function RoutePlan({ plan, destination, city }: { plan: CommuterReroutePlan; destination: string; city: string }) {
  return (
    <section className="mt-8 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border border-primary/40 bg-surface-2 px-5 py-3">
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

      {plan.disruption_identified && (
        <div className="border border-signal/40 bg-signal/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-signal" />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
              Disruption detected
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground">
            {plan.disruption_identified}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <RouteCard label="Primary route" tone="primary" steps={plan.primary_route} />
        <RouteCard label="Backup route" tone="muted" steps={plan.secondary_route} />
      </div>

      {plan.executive_summary && (
        <div className="border border-border bg-surface p-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Why these routes
          </p>
          <p className="text-[15px] leading-relaxed text-foreground">
            {plan.executive_summary}
          </p>
        </div>
      )}
    </section>
  );
}

function RouteCard({ label, tone, steps }: { label: string; tone: "primary" | "muted"; steps: RouteStep[] }) {
  const accent = tone === "primary" ? "border-primary/50" : "border-border";
  const eyebrowColor = tone === "primary" ? "text-primary" : "text-muted-foreground";
  const safeSteps = Array.isArray(steps) ? steps : [];
  return (
    <div className={`border ${accent} bg-surface`}>
      <div className="border-b border-border bg-surface-2 px-4 py-2.5">
        <p className={`font-mono text-[10px] uppercase tracking-[0.18em] ${eyebrowColor}`}>
          {label}
        </p>
      </div>
      <ol className="divide-y divide-border">
        {safeSteps.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">No steps returned.</li>
        )}
        {safeSteps.map((step, i) => (
          <li key={i} className="flex gap-3 p-4">
            <div className="flex flex-col items-center">
              <span className="grid size-7 place-items-center border border-border bg-surface-2 font-mono text-[11px] font-semibold text-foreground">
                {i + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5">
                <ModeIcon mode={step.transit_mode} />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {step.transit_mode || "Step"}
                </span>
              </div>
              <p className="text-[15px] leading-relaxed text-foreground">
                {step.instruction}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ModeIcon({ mode }: { mode: string }) {
  const m = (mode || "").toLowerCase();
  const cls = "size-3.5 text-muted-foreground";
  if (m.includes("walk") || m.includes("foot")) return <Footprints className={cls} />;
  if (m.includes("train") || m.includes("metro") || m.includes("rail")) return <Train className={cls} />;
  if (m.includes("bus")) return <Bus className={cls} />;
  if (m.includes("cab") || m.includes("taxi") || m.includes("car") || m.includes("auto")) return <Car className={cls} />;
  return <RouteIcon className={cls} />;
}
