import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-6 py-6">
        <Link to="/" className="group flex items-start gap-3">
          <span className="mt-1 grid size-6 place-items-center rounded-[2px] bg-foreground">
            <span className="block size-3 rotate-45 border-2 border-background" />
          </span>
          <span>
            <span className="block font-display text-xl font-bold tracking-tight text-foreground">
              NAVIMESH
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Urban Intelligence Systems
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          <Link
            to="/commuter"
            activeProps={{ className: "text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="font-mono text-[11px] uppercase tracking-[0.14em] transition"
          >
            Commuter
          </Link>
          <Link
            to="/planner"
            activeProps={{ className: "text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="font-mono text-[11px] uppercase tracking-[0.14em] transition"
          >
            Planner
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
            v1.0.0 / CIVIC_CORE
          </span>
        </nav>
      </div>
    </header>
  );
}
