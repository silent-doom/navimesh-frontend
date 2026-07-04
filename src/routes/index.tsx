import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NaviMesh — Urban Transit Intelligence" },
      {
        name: "description",
        content:
          "Dual-persona urban transit platform: multimodal reroutes for commuters and a decision-intelligence console for city planners.",
      },
      { property: "og:title", content: "NaviMesh — Urban Transit Intelligence" },
      {
        property: "og:description",
        content:
          "Photo-based reroutes for commuters, text-to-SQL and live civic RAG for planners.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        {/* Split personas */}
        <div className="grid gap-6 md:grid-cols-2">
          <CommuterCard />
          <PlannerCard />
        </div>

        {/* Status strip */}
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-signal" />
              Network nominal
            </span>
            <span>Latency · 14ms</span>
            <span>Sources · 1,204 municipal</span>
          </div>
          <div className="text-foreground/60">
            GCP · Cloud Run · Vertex AI · BigQuery · AlloyDB pgvector
          </div>
        </div>
      </main>
    </div>
  );
}

function CommuterCard() {
  return (
    <Link
      to="/commuter"
      className="group relative block border border-border bg-surface p-8 shadow-sm transition-colors hover:border-primary"
    >
      <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-border-strong">
        PLATFORM_B2C
      </span>
      <div className="mb-8">
        <span className="inline-block border border-primary/25 bg-primary-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Citizen Portal
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold leading-tight text-foreground">
        Navigate the city through your lens.
      </h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Upload a photo of a crowded platform, a flooded intersection, or a delayed
        board. NaviMesh identifies the disruption and recalculates two grounded
        reroutes in real time.
      </p>

      <div className="relative mt-8 aspect-video overflow-hidden border border-border bg-surface-2">
        <div className="absolute inset-4 flex items-center justify-center border border-dashed border-border-strong">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            [ CAMERA_INPUT_SYSTEM ]
          </span>
        </div>
      </div>

      <div className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-foreground px-6 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-background transition-colors group-hover:bg-foreground/85">
        Start your commute
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function PlannerCard() {
  return (
    <Link
      to="/planner"
      className="group relative block border border-ink bg-ink p-8 text-ink-foreground shadow-md transition-colors hover:border-signal"
    >
      <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-foreground/30">
        PLATFORM_B2B
      </span>
      <div className="mb-8">
        <span className="inline-block border border-signal/30 bg-signal-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-signal">
          Civic Planner
        </span>
      </div>
      <h2 className="font-display text-3xl font-bold leading-tight text-ink-foreground">
        Policy decisions at the speed of thought.
      </h2>
      <p className="mt-4 leading-relaxed text-ink-foreground/60">
        Deploy live RAG on municipal records and civic news. Convert natural-language
        queries directly into verified SQL insights, with executive summaries synthesized
        from the returned data.
      </p>

      <div className="mt-8 aspect-video overflow-hidden border border-ink-foreground/10 bg-ink-foreground/[0.04] p-4 font-mono text-[11px] leading-relaxed">
        <p className="text-signal">
          $ query --natural "Impact of rain on Route DL-MUDRIKA delay"
        </p>
        <p className="mt-2 text-ink-foreground/50">
          &gt;&gt; EXECUTING_SQL: SELECT avg(peak_delay_minutes) FROM fact_transit_logs
          WHERE route_id = 'DL-MUDRIKA' AND weather_condition = 'Rain';
        </p>
        <div className="mt-5 flex h-12 items-end gap-1">
          <div className="h-1/4 w-full bg-signal/20" />
          <div className="h-1/2 w-full bg-signal/40" />
          <div className="h-full w-full bg-signal" />
          <div className="h-3/4 w-full bg-signal/60" />
          <div className="h-1/3 w-full bg-signal/30" />
          <div className="h-2/3 w-full bg-signal/50" />
        </div>
      </div>

      <div className="mt-8 inline-flex w-full items-center justify-center gap-3 bg-background px-6 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground transition-colors group-hover:bg-background/85">
        Enter the console
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
