# Project Plan

**Status**: Ready
**Created**: 2026-04-27
**Mode**: NEW

---

## 1. Project Overview

**Goal**: A "couples scrapbook" web app. Two paired users sign in with Microsoft Entra ID, upload photos to a shared scrapbook, and each photo is automatically displayed in a scrapbook-style grid with an AI-generated caption produced by Azure OpenAI (GPT-4o vision). Every module is independently testable with full unit + integration test coverage.

**App Type**: SPA + API

**Mode**: NEW

**Deployment Plan**: No deployment plan found — services derived from requirements.

---

## 2. Runtime & Framework

| Component | Technology |
|-----------|-----------|
| **Runtime** | TypeScript (Node.js 20) |
| **Backend** | Azure Functions v4 (programming model v4) |
| **Frontend** | React + Vite |
| **Package Manager** | npm (workspaces) |

---

## 3. Test Runner & Configuration

| Component | Technology |
|-----------|-----------|
| **Test Runner** | vitest |
| **Mocking Library** | `vi.mock` |
| **Coverage** | `@vitest/coverage-v8` (target: 100% lines/branches on services + handlers) |
| **Frontend Tests** | vitest + @testing-library/react |
| **Test Command** | `npm test` (root) — runs backend, shared, and web suites |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| PostgreSQL (Flexible Server) | Users, couples, photo metadata, captions | `DATABASE_URL` | `postgresql://localdev:localdevpassword@localhost:5432/scrapbookdb` | Essential |
| Azure Blob Storage | Stores raw photo binaries; signed URLs for display | `STORAGE_CONNECTION_STRING` | `UseDevelopmentStorage=true` | Essential |
| Microsoft Entra ID | User sign-in (OIDC) and JWT validation on API | `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_API_AUDIENCE` | _(test tenant values, mock validator in tests)_ | Essential |
| Azure OpenAI (GPT-4o vision) | Generates a short caption for each uploaded photo | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` | _(no local emulator — fallback caption)_ | Enhancement |

---

## 5. Project Structure

```
project-root/
├── .azure/
│   └── project-plan.md
├── .env.example
├── .gitignore
├── package.json                          ← npm workspaces root
├── src/
│   ├── functions/                        ← Azure Functions (backend API)
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── functions/                ← One handler per file
│   │   │   │   ├── health.ts
│   │   │   │   ├── me.ts
│   │   │   │   ├── couplePair.ts
│   │   │   │   ├── coupleGet.ts
│   │   │   │   ├── photosUpload.ts
│   │   │   │   ├── photosList.ts
│   │   │   │   └── photosDelete.ts
│   │   │   ├── services/
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── IUserRepository.ts
│   │   │   │   │   ├── ICoupleRepository.ts
│   │   │   │   │   ├── IPhotoRepository.ts
│   │   │   │   │   ├── IBlobStorage.ts
│   │   │   │   │   ├── ICaptionService.ts
│   │   │   │   │   └── IAuthValidator.ts
│   │   │   │   ├── postgres/
│   │   │   │   │   ├── UserRepository.ts
│   │   │   │   │   ├── CoupleRepository.ts
│   │   │   │   │   └── PhotoRepository.ts
│   │   │   │   ├── blob/BlobStorage.ts
│   │   │   │   ├── openai/CaptionService.ts
│   │   │   │   ├── auth/EntraValidator.ts
│   │   │   │   ├── config.ts             ← Loads + validates env (zod)
│   │   │   │   └── registry.ts           ← DI factory
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   └── errorMiddleware.ts
│   │   │   ├── errors/
│   │   │   │   └── AppError.ts
│   │   │   └── lib/logger.ts
│   │   ├── tests/
│   │   │   ├── fixtures/
│   │   │   ├── mocks/                    ← In-memory implementations of interfaces
│   │   │   ├── services/                 ← Repository, blob, caption, auth tests
│   │   │   ├── functions/                ← Handler tests (one per route)
│   │   │   ├── middleware/
│   │   │   └── validation/
│   │   ├── migrations/
│   │   │   └── 001_initial.sql
│   │   └── seeds/
│   │       └── dev.sql
│   ├── web/                              ← React + Vite SPA
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── api/client.ts             ← Typed fetch wrapper
│   │       ├── auth/                     ← MSAL React provider + hooks
│   │       │   ├── msalConfig.ts
│   │       │   └── AuthProvider.tsx
│   │       ├── pages/
│   │       │   ├── SignInPage.tsx
│   │       │   ├── PairPage.tsx          ← Pair with partner via invite code
│   │       │   └── ScrapbookPage.tsx     ← Grid + upload
│   │       ├── components/
│   │       │   ├── ScrapbookGrid.tsx
│   │       │   ├── ScrapbookCard.tsx     ← Photo + AI caption
│   │       │   ├── UploadDropzone.tsx
│   │       │   └── ProtectedRoute.tsx
│   │       ├── hooks/
│   │       │   ├── usePhotos.ts
│   │       │   └── useCouple.ts
│   │       └── styles/scrapbook.css
│   │   └── tests/                        ← Component + hook tests
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── entities.ts           ← User, Couple, Photo
│           │   └── api.ts                ← Response shapes + ErrorCode union
│           └── schemas/
│               └── validation.ts         ← Zod schemas (request bodies)
└── README.md
```

---

## 6. Route Definitions

All `/api/*` routes (except `/api/health`) require a valid Entra ID JWT in `Authorization: Bearer <token>`.

| # | Method | Path | Description | Request Body | Response Body | Auth | Status Codes |
|---|--------|------|-------------|--------------|---------------|------|--------------|
| 1 | GET  | `/api/health` | Health check (DB + Blob + OpenAI reachability) | — | `{ status, services }` | None | 200, 503 |
| 2 | GET  | `/api/me` | Get current user profile (auto-provisions on first call) | — | `{ user }` | Entra | 200, 401 |
| 3 | POST | `/api/couple/pair` | Pair with partner using their invite code | `{ inviteCode }` | `{ couple }` | Entra | 200, 400, 401, 404, 409, 422 |
| 4 | GET  | `/api/couple` | Get current user's couple (incl. invite code if unpaired) | — | `{ couple }` | Entra | 200, 401, 404 |
| 5 | POST | `/api/photos` | Upload a photo (multipart). Generates caption async-but-awaited; returns photo with caption (or fallback caption on AI failure). | `multipart/form-data: file` | `{ photo }` | Entra | 201, 400, 401, 403, 422 |
| 6 | GET  | `/api/photos` | List all photos for the user's couple, newest first | — | `{ photos: Photo[] }` | Entra | 200, 401, 403 |
| 7 | DELETE | `/api/photos/{id}` | Delete a photo (must belong to caller's couple) | — | `204` | Entra | 204, 401, 403, 404 |

---

## 7. Database Constraints

| Table | Constraint Type | Column(s) | Detail |
|-------|----------------|-----------|--------|
| `users` | PK | `id` (uuid) | |
| `users` | UNIQUE | `entra_object_id` | One user per Entra principal |
| `users` | UNIQUE | `email` | Prevent duplicate registration |
| `users` | FK | `couple_id → couples.id` | `ON DELETE SET NULL` |
| `couples` | PK | `id` (uuid) | |
| `couples` | UNIQUE | `invite_code` | Used for pairing |
| `couples` | CHECK | member count ≤ 2 | Enforced by app + partial unique index on `users(couple_id)` allowing max 2 |
| `photos` | PK | `id` (uuid) | |
| `photos` | FK | `couple_id → couples.id` | `ON DELETE CASCADE` |
| `photos` | FK | `uploader_id → users.id` | `ON DELETE SET NULL` |
| `photos` | NOT NULL | `blob_path`, `content_type`, `created_at` | |
| `photos` | INDEX | `(couple_id, created_at DESC)` | List query optimization |

### 7a. Collection-to-Table Name Mapping

| Collection Name (handler code) | SQL Table Name (migration) | Mapping Rule |
|-------------------------------|---------------------------|--------------|
| `'user'`   | `users`   | camelToSnake + pluralize |
| `'couple'` | `couples` | camelToSnake + pluralize |
| `'photo'`  | `photos`  | camelToSnake + pluralize |

---

## 8. Service Dependency Classification

| Service | Type | Failure Behavior |
|---------|------|------------------|
| PostgreSQL | Essential | Request fails with 503 (health) or 500 (other) |
| Blob Storage | Essential | Upload/list returns 503; constructor throws on missing config |
| Microsoft Entra ID (JWT validation) | Essential | Returns 401 on invalid/missing token |
| Azure OpenAI (caption) | **Enhancement** | On error/timeout, photo is saved with fallback caption (`"A new memory ✨"`); warning logged. Constructor MUST NOT throw on missing config. |

---

## 9. Execution Checklist

> The detailed execution checklist is auto-generated by `azure-project-scaffold` when it begins execution. It copies this section's high-level phases and expands them into step-by-step items with build gates.

### High-Level Phases
- [ ] Step 1: Foundation (npm workspaces, tsconfig, directory structure, build verification)
- [ ] Step 2: Configuration & Environment (`config.ts` with zod, `.env.example`, `local.settings.json`)
- [ ] Step 3: Service Abstraction Layer (interfaces + Postgres/Blob/OpenAI/Entra implementations + registry)
- [ ] Step 4: Database Schema & Migrations (`001_initial.sql` for users/couples/photos)
- [ ] Step 5: Shared Types & Validation Schemas (entities, API contracts, zod schemas)
- [ ] Step 6: API Routes / Functions (one handler per route, 7 handlers)
- [ ] Step 7: Error Handling Middleware (AppError → standard error envelope)
- [ ] Step 8: Health Check Endpoint
- [ ] Step 9: OpenAPI Contract
- [ ] Step 10: Structured Logging
- [ ] Step 11: Wire Frontend (React + Vite, MSAL sign-in, scrapbook UI, upload, full component tests)
- [ ] Step 12: Wrap Up (full test run, coverage report, README)

---

## 10. Files to Generate

| File | Action | Description |
|------|--------|-------------|
| `package.json` | CREATE | npm workspaces root (functions, web, shared) |
| `.env.example` | CREATE | All required env vars documented |
| `.gitignore` | CREATE | Node, env, build artifacts |
| `README.md` | CREATE | Setup, test, run instructions |
| `src/shared/**` | CREATE | Entity types, API contracts, zod schemas |
| `src/functions/host.json` | CREATE | Functions host config |
| `src/functions/local.settings.json` | CREATE | Local env values |
| `src/functions/package.json` + `tsconfig.json` + `vitest.config.ts` | CREATE | Backend project config |
| `src/functions/src/services/**` | CREATE | Interfaces + Postgres/Blob/OpenAI/Entra implementations + config + registry |
| `src/functions/src/middleware/**` | CREATE | Auth + error middleware |
| `src/functions/src/errors/AppError.ts` | CREATE | App error type |
| `src/functions/src/functions/*.ts` | CREATE | 7 handler files (one per route) |
| `src/functions/migrations/001_initial.sql` | CREATE | DB schema |
| `src/functions/tests/**` | CREATE | Unit + integration tests for every service, handler, middleware, schema |
| `src/web/**` | CREATE | React + Vite app: MSAL auth, sign-in, pair, scrapbook grid, upload, tests |

---

## 11. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-verify** for test coverage
3. Run **azure-local-development** for Docker emulators (Postgres, Azurite) and VS Code debugging
4. Run **azure-prepare** → **azure-deploy** when ready to deploy
