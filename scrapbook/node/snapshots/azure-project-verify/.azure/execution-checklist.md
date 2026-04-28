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

## Verify Phase

- [x] V1: Test infrastructure (vitest configs, setup files, jest-dom + jsdom envs, mock @azure/functions, env defaults, beforeEach service reset)
- [x] V2: Mock services (`mockUserRepository`, `mockCoupleRepository`, `mockPhotoRepository`, `mockBlobStorage`, `mockCaptionService`, `mockAuthValidator`, `buildMockServices()`)
- [x] V3: Fixtures (users, couples, photos JSON)
- [x] V4: Service tests (registry auto-init + Enhancement safety, config zod, errorMiddleware factories + envelope mapping)
- [x] V5: Validation tests (every zod schema)
- [x] V6: Backend handler tests — 8 files, 70 tests passing (health degraded/unhealthy, auth 401, auto-provision, couple lazy create + pair scenarios incl. 401/422/404/409, photos upload incl. **Enhancement resilience** + multipart + raw image + 422 oversize, photos list newest-first, photos delete with foreign-couple 403, openapi shape)
- [x] V6b: Frontend tests — 6 files, 19 tests passing (ScrapbookCard, ScrapbookGrid, UploadDropzone, ProtectedRoute, usePhotos, MockClient round-trip)
- [x] V7: Lint sweep — zero `: any` / `as any` in src; zero direct SDK imports in handlers (only `@azure/functions`)
- [x] V8: Build & test gate — `npm run build` clean; backend 70/70 ✅; frontend 19/19 ✅
- [x] V9: Plan status → Ready
