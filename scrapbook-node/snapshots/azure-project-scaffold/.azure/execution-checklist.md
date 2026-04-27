# Execution Checklist

> Live tracker of scaffolding progress. Copied from project-plan.md Section 9.

- [x] Step 0: Plan validated, checklist created, status `In Progress`
- [x] Step 0.5: Frontend preview (React + Vite, mock auth, scrapbook UI, opened in Simple Browser)
- [x] Step 1: Foundation (npm workspaces, tsconfig, directory structure, build verification)
- [x] Step 2: Configuration & Environment (`config.ts` with zod, `.env.example`, `local.settings.json`)
- [x] Step 3: Service Abstraction Layer (interfaces + Postgres/Blob/OpenAI/Entra implementations + registry)
- [x] Step 4: Database Schema & Migrations (`001_initial.sql` for users/couples/photos + seeds/dev.sql)
- [x] Step 5: Shared Types & Validation Schemas (entities, API contracts, zod schemas)
- [x] Step 6: API Routes / Functions (8 handlers — 7 routes + openapi)
- [x] Step 7: Error Handling Middleware (AppError + withErrors wrapper → standard error envelope)
- [x] Step 8: Health Check Endpoint (Essentials → 200/503; Enhancement → degraded 200)
- [x] Step 9: OpenAPI Contract (served at `/api/openapi.json`)
- [x] Step 10: Structured Logging (pino in registry + caption + error middleware)
- [x] Step 11: Wire Frontend (typed ApiClient: MockClient for preview, HttpClient for prod via VITE_USE_MOCK_API=false)
- [x] Step 12: Wrap Up — `npm run build` clean across 3 workspaces; `func start` registered all 8 functions; Vite dev server boots; `main` field corrected to `dist/functions/*.js`; plan status → Scaffolded
