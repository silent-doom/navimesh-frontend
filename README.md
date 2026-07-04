# NaviMesh — Frontend

Dual-persona urban transit intelligence app.

- **Commuter (B2C)** — snap a photo of a disruption (crowd, waterlogging, closure), get two grounded reroutes that cross-check the scene against live civic news and transit telemetry.
- **City Planner (B2B)** — a console with two grounded interfaces: ask the transit warehouse in plain English (text-to-SQL) or ask the street in real time (live RAG over civic news).

The UI is intentionally civic-infrastructure in tone — hairline dividers, mono-spaced eyebrows, no gradients or glassmorphism — modelled after transit wayfinding systems (MTA / TfL / Vignelli) rather than generic SaaS.

---

## Tech stack

| Layer     | Choice                                                               |
| --------- | -------------------------------------------------------------------- |
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, SSR-ready) |
| Bundler   | Vite 7                                                               |
| Styling   | Tailwind CSS v4 (CSS-first tokens in`src/styles.css`)              |
| UI        | shadcn/ui primitives,`lucide-react` icons                          |
| Fonts     | Space Grotesk (display), DM Sans (body), JetBrains Mono (labels)     |
| HTTP      | `axios` with a small typed client in `src/lib/api.ts`            |
| Markdown  | `react-markdown` with custom civic-styled renderers                |
| Runtime   | Node 20+ / Bun 1.1+                                                  |

---

## Getting started

```bash
# 1. Install deps (bun is fastest; npm/pnpm/yarn also work)
bun install

# 2. Point the frontend at your backend
cp .env.example .env
# edit .env → VITE_API_BASE_URL=http://127.0.0.1:8000

# 3. Run the dev server
bun run dev            # → http://localhost:8080
```

Other scripts:

```bash
bun run build          # production build
bun run build:dev      # dev-mode build (skips SSR prerender gates)
bun run preview        # serve the built artifact locally
bun run lint           # eslint
bun run format         # prettier --write .
```

---

## Environment variables

Only one is required by the frontend:

| Name                  | Purpose                                           | Example                   |
| --------------------- | ------------------------------------------------- | ------------------------- |
| `VITE_API_BASE_URL` | Origin of the NaviMesh backend (FastAPI service). | `http://127.0.0.1:8000` |

`VITE_*` variables are **baked at build time**. If you deploy the same
artifact to multiple environments, either build per-env or expose a
`/api/config` route and read it at runtime.

---

## Backend contract

Three endpoints are consumed. Full types live in `src/lib/api.ts`.

### `POST /api/v1/commuter/reroute` — `multipart/form-data`

| Field           | Type   | Notes                      |
| --------------- | ------ | -------------------------- |
| `city`        | string | e.g.`"Delhi"`            |
| `destination` | string | Free-text destination      |
| `file`        | File   | JPEG/PNG of the disruption |

Response:

```json
{
  "status": "ok",
  "city": "Delhi",
  "destination": "Connaught Place",
  "ai_reroute_plan": "## Option 1 … markdown …"
}
```

### `POST /api/v1/planner/text-to-sql` — `application/json`

```json
{ "user_query": "average peak delay per route in rainy weather" }
```

Response:

```json
{
  "status": "ok",
  "generated_sql": "SELECT ...",
  "data": [{ "route_id": "R12", "avg_delay_min": 14.2 }],
  "executive_insight": "**Key finding:** …"
}
```

### `POST /api/v1/planner/live-rag-chat` — `application/json`

```json
{ "city": "Delhi", "user_query": "any flooding or transit strikes right now?" }
```

Response:

```json
{
  "status": "ok",
  "city_monitored": "Delhi",
  "ai_response": "…markdown synthesis…",
  "retrieved_source_document": "…concatenated source snippets…",
  "vector_confidence_score": 0.81
}
```

### CORS

The backend must allow the frontend origin. During local dev:

```python
# FastAPI
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Project layout

```
src/
├─ routes/
│  ├─ __root.tsx          # shell: <html>/<head>/<body>, providers
│  ├─ index.tsx           # landing → pick Commuter or Planner
│  ├─ commuter.tsx        # B2C: photo → grounded reroute plan
│  └─ planner.tsx         # B2B: text-to-SQL + live RAG tabs
├─ components/
│  ├─ AppHeader.tsx       # civic wordmark + nav
│  └─ ui/                 # shadcn primitives
├─ lib/
│  ├─ api.ts              # typed axios client + response types
│  ├─ friendly-error.ts   # maps raw errors to plain-language messages
│  └─ utils.ts            # cn() helper
├─ styles.css             # Tailwind v4 tokens (Navy Trust palette)
└─ routeTree.gen.ts       # ⚠️  auto-generated — do NOT edit
```

---

## Design system

Palette (defined as tokens in `src/styles.css` under `@theme inline`):

| Token                | Value                 | Use                           |
| -------------------- | --------------------- | ----------------------------- |
| `background`       | slate-50 substrate    | Page background               |
| `foreground`       | slate-900 ink         | Body text, primary buttons    |
| `primary`          | navy`#1e3a5f`       | Commuter accents, links       |
| `signal`           | steel-blue`#3b6fa0` | Planner accents, status chips |
| `border`           | hairline slate        | Dividers, card borders        |
| `surface` / `-2` | white / slate-100     | Card / nested-card fills      |

Rules:

- No gradients, no glassmorphism, no glow shadows.
- All colour comes from tokens — never hex literals or `text-white`/`bg-black`.
- Eyebrows are `font-mono`, `10-11px`, `uppercase`, `tracking-[0.16–0.20em]`.
- Numeric UI (row counts, coordinates, SQL) is always mono.

---

## Deployment (Google Cloud Run)

The frontend and backend can be deployed independently.

### Frontend (Cloud Run, containerized SSR)

```dockerfile
# Dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV PORT=8080
EXPOSE 8080
CMD ["bun", "run", ".output/server/index.mjs"]
```

Build & deploy:

```bash
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/navimesh-web \
  --substitutions=_API_URL=https://navimesh-api-XXXX.a.run.app

gcloud run deploy navimesh-web \
  --image gcr.io/$PROJECT_ID/navimesh-web \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_API_BASE_URL=https://navimesh-api-XXXX.a.run.app
```

> `VITE_*` is baked at build time. Pass it as a `--build-arg` (or Cloud
> Build substitution) — setting it only at runtime has no effect.

### Backend (Cloud Run, separate service)

Deploy the FastAPI service to its own Cloud Run service and use its
HTTPS URL as `VITE_API_BASE_URL` above. Alternatively, front both with
a single load balancer so they share an origin and CORS goes away.

---

## Handoff & notes

- `HANDOFF.md` — deeper implementation notes for the next engineer.
- `gitignore.recommended` — rename to `.gitignore` before pushing.
- Never edit `src/routeTree.gen.ts`; the TanStack Router Vite plugin
  regenerates it on every dev/build run.
- `process.env.*` is server-only. Anything the browser needs must be
  `import.meta.env.VITE_*`.

---

## License

Proprietary — internal project. Update this section before open-sourcing.
