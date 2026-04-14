# Project Plan — CoupleSnap

**Status**: Ready
**Created**: 2026-03-18
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build a couples scrapbook application where users can sign up, pair with a partner via invite, and upload photos to a shared scrapbook. Each photo gets an AI-generated caption. The UI presents photos in a scrapbook-style layout. The project is designed so that every module is independently testable. An AI agent can self-validate each component by running its test suite — if tests pass, the module is working as intended.

**App Type**: SPA + API

**Mode**: NEW — Scaffolding entire project from scratch

**Deployment Plan**: No deployment plan found — services determined from user input

---

## 2. Runtime & Framework

| Component | Technology |
|-----------|-----------|
| **Runtime** | TypeScript (Node.js) |
| **Backend** | Azure Functions v4 |
| **Frontend** | React + Vite |
| **Package Manager** | npm (workspaces) |

---

## 3. Test Runner & Configuration

| Component | Technology |
|-----------|-----------|
| **Test Runner** | Jest |
| **Mocking Library** | jest.mock |
| **Assertion Library** | jest expect |
| **Coverage Tool** | jest --coverage |
| **Test Command** | `npm test` |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) |
|---------------|------------|---------------------|----------------------|
| Azure Blob Storage | Store uploaded photos | `STORAGE_CONNECTION_STRING` | `UseDevelopmentStorage=true` |
| PostgreSQL (Flexible Server) | Users, couples, invites, photo metadata | `DATABASE_URL` | `postgresql://localdev:localdevpassword@localhost:5432/couplesnap` |
| Azure OpenAI | Generate AI captions for uploaded photos | `AZURE_OPENAI_ENDPOINT` | `http://localhost:11434` (local LLM or mock) |

> _Services listed here are for code and environment configuration. To run these services locally via Docker emulators, use the **azure-local-development** skill._

---

## 5. Project Structure

```
couplesnap/
├── .azure/
│   └── project-plan.md
├── .env.example
├── .gitignore
├── package.json                    ← Root workspace config
├── src/
│   ├── functions/                  ← Azure Functions project
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   ├── openapi.yaml
│   │   ├── src/
│   │   │   ├── functions/          ← One file per Azure Function
│   │   │   │   ├── register.ts
│   │   │   │   ├── login.ts
│   │   │   │   ├── getMe.ts
│   │   │   │   ├── createInvite.ts
│   │   │   │   ├── listInvites.ts
│   │   │   │   ├── acceptInvite.ts
│   │   │   │   ├── getCouple.ts
│   │   │   │   ├── uploadPhoto.ts
│   │   │   │   ├── listPhotos.ts
│   │   │   │   ├── getPhoto.ts
│   │   │   │   ├── deletePhoto.ts
│   │   │   │   ├── health.ts
│   │   │   │   └── openapi.ts
│   │   │   ├── services/
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── IDatabaseService.ts
│   │   │   │   │   ├── IStorageService.ts
│   │   │   │   │   └── IAICaptionService.ts
│   │   │   │   ├── database.ts
│   │   │   │   ├── storage.ts
│   │   │   │   ├── aiCaption.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── registry.ts
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   ├── errorTypes.ts
│   │   │   │   └── errorHandler.ts
│   │   │   ├── middleware/
│   │   │   │   ├── authMiddleware.ts
│   │   │   │   └── requestLogger.ts
│   │   │   └── logger.ts
│   │   ├── tests/
│   │   │   ├── setup.ts
│   │   │   ├── helpers/
│   │   │   │   └── testUtils.ts
│   │   │   ├── fixtures/
│   │   │   │   ├── users.json
│   │   │   │   ├── couples.json
│   │   │   │   ├── invites.json
│   │   │   │   └── photos.json
│   │   │   ├── mocks/
│   │   │   │   ├── MockDatabaseService.ts
│   │   │   │   ├── MockStorageService.ts
│   │   │   │   └── MockAICaptionService.ts
│   │   │   ├── services/
│   │   │   │   ├── config.test.ts
│   │   │   │   └── registry.test.ts
│   │   │   ├── functions/
│   │   │   │   ├── register.test.ts
│   │   │   │   ├── login.test.ts
│   │   │   │   ├── getMe.test.ts
│   │   │   │   ├── createInvite.test.ts
│   │   │   │   ├── listInvites.test.ts
│   │   │   │   ├── acceptInvite.test.ts
│   │   │   │   ├── getCouple.test.ts
│   │   │   │   ├── uploadPhoto.test.ts
│   │   │   │   ├── listPhotos.test.ts
│   │   │   │   ├── getPhoto.test.ts
│   │   │   │   ├── deletePhoto.test.ts
│   │   │   │   ├── health.test.ts
│   │   │   │   └── openapi.test.ts
│   │   │   ├── errors/
│   │   │   │   └── errorHandler.test.ts
│   │   │   └── validation/
│   │   │       ├── authSchemas.test.ts
│   │   │       ├── inviteSchemas.test.ts
│   │   │       ├── photoSchemas.test.ts
│   │   │       └── paramSchemas.test.ts
│   │   └── seeds/
│   │       ├── migrations/
│   │       │   └── 001_initial_schema.ts
│   │       ├── seed.ts
│   │       └── fixtures/
│   │           └── seed-data.json
│   ├── web/                        ← Frontend (React + Vite)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       ├── api/
│   │       │   └── client.ts       ← Typed API client
│   │       ├── components/
│   │       │   ├── AuthForm.tsx     ← Shared login/register form
│   │       │   ├── PhotoCard.tsx    ← Scrapbook photo card
│   │       │   ├── ScrapbookGrid.tsx
│   │       │   ├── UploadModal.tsx
│   │       │   └── ConfirmDialog.tsx
│   │       ├── pages/
│   │       │   ├── LoginPage.tsx
│   │       │   ├── RegisterPage.tsx
│   │       │   ├── ScrapbookPage.tsx
│   │       │   ├── InvitePage.tsx
│   │       │   └── ProfilePage.tsx
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── usePhotos.ts
│   │       │   └── useCouple.ts
│   │       └── types/              ← Re-exports from shared
│   └── shared/                     ← Shared types and schemas
│       ├── package.json
│       ├── tsconfig.json
│       ├── types/
│       │   ├── index.ts
│       │   ├── entities.ts
│       │   └── api.ts
│       └── schemas/
│           ├── auth.ts
│           ├── invite.ts
│           ├── photo.ts
│           └── params.ts
└── data/                           ← Docker volume mounts (gitignored)
```

---

## 6. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Auth | Status Codes |
|---|--------|------|-------------|-------------|--------------|------|-------------|
| 1 | POST | `/api/auth/register` | Register new user | `{ email, password, displayName }` | `{ user: PublicUser, token: string }` | None | 201, 400, 409, 422 |
| 2 | POST | `/api/auth/login` | Login | `{ email, password }` | `{ user: PublicUser, token: string }` | None | 200, 401, 422 |
| 3 | GET | `/api/auth/me` | Get current user profile | — | `{ user: PublicUser }` | Required | 200, 401 |
| 4 | POST | `/api/invites` | Send pairing invite | `{ toEmail }` | `{ invite: Invite }` | Required | 201, 400, 409, 422 |
| 5 | GET | `/api/invites` | List invites (sent & received) | Query: `?type=sent\|received` | `{ invites: Invite[], total: number }` | Required | 200, 401 |
| 6 | POST | `/api/invites/:id/accept` | Accept invite, form couple | — | `{ couple: Couple }` | Required | 200, 400, 404, 409 |
| 7 | GET | `/api/couple` | Get current couple info | — | `{ couple: Couple }` | Required | 200, 401, 404 |
| 8 | POST | `/api/photos` | Upload photo (with AI caption) | Multipart: file + `{ caption?: string }` | `{ photo: Photo }` | Required | 201, 400, 401, 413, 422 |
| 9 | GET | `/api/photos` | List photos for couple (scrapbook) | Query: `?limit=20&offset=0` | `{ photos: Photo[], total: number }` | Required | 200, 401, 404 |
| 10 | GET | `/api/photos/:id` | Get single photo | — | `{ photo: Photo }` | Required | 200, 401, 404 |
| 11 | DELETE | `/api/photos/:id` | Delete photo | — | `{ success: true }` | Required | 200, 401, 403, 404 |
| 12 | GET | `/api/health` | Health check | — | `{ status, services: {...} }` | None | 200, 503 |
| 13 | GET | `/api/openapi.json` | OpenAPI spec | — | OpenAPI 3.x JSON | None | 200 |

---

## 7. Database Constraints

| Table | Constraint Type | Column(s) | Detail |
|-------|----------------|-----------|--------|
| users | UNIQUE | email | Prevent duplicate registration |
| users | FK | couple_id → couples.id | ON DELETE SET NULL |
| users | NOT NULL | email, password_hash, display_name | Required fields |
| couples | — | id, created_at, updated_at | Auto-generated |
| photos | FK | couple_id → couples.id | ON DELETE CASCADE |
| photos | FK | uploaded_by_user_id → users.id | ON DELETE CASCADE |
| photos | INDEX | couple_id | Frequent filter/JOIN column |
| photos | NOT NULL | blob_url, couple_id, uploaded_by_user_id | Required fields |
| pairing_invites | FK | from_user_id → users.id | ON DELETE CASCADE |
| pairing_invites | CHECK | status | IN ('pending', 'accepted', 'rejected') |
| pairing_invites | INDEX | to_email, status | Invite lookup |
| pairing_invites | INDEX | from_user_id | Sent invite lookup |
| pairing_invites | NOT NULL | from_user_id, to_email, status | Required fields |

---

## 8. Service Dependency Classification

| Service | Type | Failure Behavior |
|---------|------|-----------------|
| PostgreSQL | Essential | Request fails with 503 |
| Azure Blob Storage | Essential | Upload fails with 503 |
| Azure OpenAI (AI Captions) | Enhancement | Falls back to default caption: "A special moment 📸" |

> **Essential**: Request MUST fail if this service is down.
> **Enhancement**: Request should succeed with degraded output (fallback value).

---

## 9. Execution Checklist

> Each phase has a test gate (🧪). The agent MUST run tests and verify they pass before checking the box and proceeding.

### Phase 1: Planning
- [x] Analyze workspace (mode: NEW)
- [x] Gather requirements (TypeScript, PostgreSQL + Blob Storage + OpenAI, React + Vite)
- [x] Select test runner (Jest)
- [x] Select Azure services (PostgreSQL, Blob Storage, Azure OpenAI)
- [x] Design project structure
- [x] Define routes (13 routes)
- [x] Generate execution checklist
- [x] Define test suite plan
- [x] Write `.azure/project-plan.md`
- [ ] Present plan — get user approval

### Phase 2: Execution

#### Step 1: Foundation
- [ ] Initialize root `package.json` with workspaces
- [ ] Initialize `src/functions/package.json` with Azure Functions deps
- [ ] Initialize `src/shared/package.json` with build script and exports map
- [ ] Initialize `src/web/package.json` with React + Vite
- [ ] Configure TypeScript (`tsconfig.json` for each workspace)
- [ ] Configure Jest (`jest.config.ts` for functions)
- [ ] Configure ESLint + Prettier
- [ ] Create directory structure
- [ ] Create `.gitignore`
- [ ] 🧪 **Test Gate**: All workspaces build with zero errors; every workspace has a `build` script; shared package produces `dist/` with `.js` and `.d.ts` files; Jest executes cleanly

#### Step 2: Configuration & Environment
- [ ] Create config module (`src/functions/src/services/config.ts`)
- [ ] Create `.env.example` with all variables
- [ ] Create `src/functions/local.settings.json`
- [ ] Implement startup env validation (fail fast on missing)
- [ ] Write config unit tests
- [ ] 🧪 **Test Gate**: All config tests pass

#### Step 3: Service Abstraction Layer
- [ ] Create `IDatabaseService` interface (with `transaction()` method)
- [ ] Create `IStorageService` interface
- [ ] Create `IAICaptionService` interface
- [ ] Create `PostgresDatabaseService` concrete implementation (with auto-managed field stripping, transaction support)
- [ ] Create `AzureBlobStorageService` concrete implementation
- [ ] Create `AzureOpenAICaptionService` concrete implementation
- [ ] Create `MockDatabaseService` (matching concrete behavior — field stripping, timestamps)
- [ ] Create `MockStorageService`
- [ ] Create `MockAICaptionService`
- [ ] Create service registry (auto-init with concrete at runtime; tests pre-register mocks)
- [ ] Write unit tests for mock implementations
- [ ] Write unit tests for service registry
- [ ] 🧪 **Test Gate**: All service abstraction tests pass

#### Step 4: Database Schema & Migrations
- [ ] Create migration `001_initial_schema.ts` — users, couples, pairing_invites, photos tables
- [ ] Include UNIQUE constraint on users.email
- [ ] Include FK constraints with ON DELETE behavior (per Section 7)
- [ ] Include CHECK constraint on pairing_invites.status
- [ ] Include indexes on photos.couple_id, pairing_invites.to_email+status, pairing_invites.from_user_id
- [ ] Create seed data fixtures (`seed-data.json`)
- [ ] Create seed script (idempotent)
- [ ] Write migration tests (forward, backward)
- [ ] Write constraint tests (duplicate rejection, FK enforcement)
- [ ] Write seed data tests (correct row counts, no duplicates)
- [ ] File existence checks: verify migration files exist and are non-empty
- [ ] Migration count validation: at least 1 migration file covering all 4 tables
- [ ] 🧪 **Test Gate**: All migration, constraint, and seed tests pass

#### Step 5: Shared Types & Validation
- [ ] Create entity types: `User`, `PublicUser`, `Couple`, `Invite`, `Photo` in `src/shared/types/entities.ts`
- [ ] Create API contracts: request/response types in `src/shared/types/api.ts`
- [ ] Define `ErrorCode` typed union (not plain string) in `src/shared/types/index.ts`
- [ ] Create Zod schemas: `registerSchema`, `loginSchema` in `src/shared/schemas/auth.ts`
- [ ] Create Zod schemas: `createInviteSchema` in `src/shared/schemas/invite.ts`
- [ ] Create Zod schemas: `uploadPhotoSchema`, `listPhotosQuerySchema` in `src/shared/schemas/photo.ts`
- [ ] Create Zod schemas: `uuidParamSchema` in `src/shared/schemas/params.ts`
- [ ] Create file upload validation (max 10MB, image/jpeg + image/png + image/webp)
- [ ] Wire validation into function handlers
- [ ] Schema completeness check: 13 routes → all have corresponding schemas
- [ ] Write validation tests (valid/invalid input, edge cases, file limits, UUID params)
- [ ] 🧪 **Test Gate**: All validation tests pass, schema coverage = 100%

#### Step 6: API Routes / Functions

**Feature: Register — `POST /api/auth/register`**
- [ ] Create handler, hash password with bcrypt, create user, return JWT
- [ ] Write tests: happy path (201), duplicate email (409), invalid input (422)
- [ ] 🧪 **Test Gate**: All register tests pass

**Feature: Login — `POST /api/auth/login`**
- [ ] Create handler, verify password, return JWT
- [ ] Write tests: happy path (200), wrong password (401), invalid input (422)
- [ ] 🧪 **Test Gate**: All login tests pass

**Feature: Get Me — `GET /api/auth/me`**
- [ ] Create handler, extract user from JWT
- [ ] Write tests: happy path (200), no token (401)
- [ ] 🧪 **Test Gate**: All getMe tests pass

**Feature: Create Invite — `POST /api/invites`**
- [ ] Create handler, prevent self-invite and duplicate invite
- [ ] Write tests: happy path (201), self-invite (400), duplicate (409), already coupled (400)
- [ ] 🧪 **Test Gate**: All createInvite tests pass

**Feature: List Invites — `GET /api/invites`**
- [ ] Create handler, filter by sent/received
- [ ] Write tests: happy path (200), filter by type, empty list
- [ ] 🧪 **Test Gate**: All listInvites tests pass

**Feature: Accept Invite — `POST /api/invites/:id/accept`**
- [ ] Create handler, use `database.transaction()` for atomic couple creation (create couple + update both users + update invite status)
- [ ] Write tests: happy path (200), not found (404), already accepted (409), wrong recipient (403)
- [ ] 🧪 **Test Gate**: All acceptInvite tests pass

**Feature: Get Couple — `GET /api/couple`**
- [ ] Create handler, return couple with both users
- [ ] Write tests: happy path (200), not coupled (404)
- [ ] 🧪 **Test Gate**: All getCouple tests pass

**Feature: Upload Photo — `POST /api/photos`**
- [ ] Create handler: validate file → upload to blob storage → generate AI caption (Enhancement: try/catch with fallback) → save metadata to DB
- [ ] Validate file size (max 10MB) and MIME type server-side
- [ ] Write tests: happy path (201), oversized file (413), wrong MIME (422), AI failure graceful (201 with default caption), not coupled (400)
- [ ] 🧪 **Test Gate**: All uploadPhoto tests pass

**Feature: List Photos — `GET /api/photos`**
- [ ] Create handler, return paginated photos for couple
- [ ] Write tests: happy path (200), pagination, not coupled (404)
- [ ] 🧪 **Test Gate**: All listPhotos tests pass

**Feature: Get Photo — `GET /api/photos/:id`**
- [ ] Create handler, return single photo with access check
- [ ] Write tests: happy path (200), not found (404), wrong couple (403)
- [ ] 🧪 **Test Gate**: All getPhoto tests pass

**Feature: Delete Photo — `DELETE /api/photos/:id`**
- [ ] Create handler, delete from storage + DB, require confirmation concept
- [ ] Write tests: happy path (200), not found (404), not owner (403)
- [ ] 🧪 **Test Gate**: All deletePhoto tests pass

#### Step 7: Error Handling
- [ ] Create error types: `AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`
- [ ] Create error handler middleware
- [ ] Create standardized error response builder: `{ error: { code: ErrorCode, message, details? } }`
- [ ] Write error handling tests
- [ ] 🧪 **Test Gate**: All error handling tests pass

#### Step 8: Health Check
- [ ] Create `/api/health` function (checks DB, Storage, AI)
- [ ] Write health check tests (healthy, degraded, unhealthy)
- [ ] 🧪 **Test Gate**: All health check tests pass

#### Step 9: OpenAPI Contract
- [ ] Generate `openapi.yaml` from route definitions
- [ ] Create `/api/openapi.json` endpoint
- [ ] Write contract tests
- [ ] 🧪 **Test Gate**: Spec valid, contract tests pass

#### Step 10: Structured Logging
- [ ] Configure pino logger
- [ ] Add request logging middleware
- [ ] Add operation logging in services
- [ ] Write logging tests
- [ ] 🧪 **Test Gate**: All logging tests pass

#### Step 11: Frontend
- [ ] Initialize React + Vite project
- [ ] Create fully typed API client using shared types — **no `any` types**
- [ ] Configure dev proxy (`/api` → `http://localhost:7071`)
- [ ] Create `AuthForm` shared component (used by LoginPage + RegisterPage)
- [ ] Create `LoginPage` and `RegisterPage` (using shared AuthForm)
- [ ] Create `ScrapbookPage` with grid layout, photo cards with AI captions
- [ ] Create `InvitePage` (send invite, view pending invites)
- [ ] Create `ProfilePage` (user info, couple status)
- [ ] Create `UploadModal` with client-side file validation (size + MIME)
- [ ] Create `ConfirmDialog` for destructive actions (delete photo)
- [ ] Handle all 4 data states on every page (loading, error, empty, data)
- [ ] Error handling in hooks with optimistic update rollback
- [ ] Write auth flow tests (login, logout, token expiry)
- [ ] Write protected route tests
- [ ] Write data display tests (photo list renders)
- [ ] Write error state tests
- [ ] Write form validation tests
- [ ] Write destructive action confirmation test
- [ ] 🧪 **Test Gate**: Frontend builds, all tests pass, no `any` types

#### Step 12: Dead Code & Lint Sweep
- [ ] Run ESLint across entire project — zero errors
- [ ] Remove unused imports, dead code
- [ ] Verify all middleware is wired
- [ ] Verify schema completeness
- [ ] 🧪 **Test Gate**: Linter clean, all tests still pass

#### Step 13: Finalize
- [ ] Run full test suite — ALL tests must pass
- [ ] Build all workspaces — verify `dist/` output for shared package
- [ ] End-to-end smoke test: `func start` → verify all 13 functions load → hit `/api/health` → 200
- [ ] 🧪 **Final Test Gate**: Zero failures, smoke test passes
- [ ] Update status to `Ready`

---

## 10. Test Suite Plan

| # | Test File | Type | Tests | Mock Data Source | Pass Criteria |
|---|-----------|------|-------|-----------------|---------------|
| 1 | `tests/services/config.test.ts` | Unit | Config loading, defaults, missing var errors | Inline env vars | All assertions pass |
| 2 | `tests/services/registry.test.ts` | Unit | Factory returns correct impl based on config | Inline config | Correct service type returned |
| 3 | `tests/errors/errorHandler.test.ts` | Unit | Error type → HTTP status mapping | Inline error instances | Correct status + shape |
| 4 | `tests/validation/authSchemas.test.ts` | Unit | Register/login schema validation | Inline valid/invalid data | Validation pass/fail correct |
| 5 | `tests/validation/inviteSchemas.test.ts` | Unit | Create invite schema validation | Inline valid/invalid data | Validation pass/fail correct |
| 6 | `tests/validation/photoSchemas.test.ts` | Unit | Upload photo schema, file validation | Inline valid/invalid data | Size/MIME checks correct |
| 7 | `tests/validation/paramSchemas.test.ts` | Unit | UUID param schema | Inline valid/invalid UUIDs | UUID format enforced |
| 8 | `tests/functions/register.test.ts` | Unit | POST /api/auth/register | `fixtures/users.json` | 201, 409, 422 |
| 9 | `tests/functions/login.test.ts` | Unit | POST /api/auth/login | `fixtures/users.json` | 200, 401, 422 |
| 10 | `tests/functions/getMe.test.ts` | Unit | GET /api/auth/me | `fixtures/users.json` | 200, 401 |
| 11 | `tests/functions/createInvite.test.ts` | Unit | POST /api/invites | `fixtures/invites.json` | 201, 400, 409, 422 |
| 12 | `tests/functions/listInvites.test.ts` | Unit | GET /api/invites | `fixtures/invites.json` | 200 |
| 13 | `tests/functions/acceptInvite.test.ts` | Unit | POST /api/invites/:id/accept | `fixtures/invites.json` | 200, 404, 409 |
| 14 | `tests/functions/getCouple.test.ts` | Unit | GET /api/couple | `fixtures/couples.json` | 200, 404 |
| 15 | `tests/functions/uploadPhoto.test.ts` | Unit | POST /api/photos (with AI fallback test) | `fixtures/photos.json` | 201, 413, 422 |
| 16 | `tests/functions/listPhotos.test.ts` | Unit | GET /api/photos | `fixtures/photos.json` | 200 |
| 17 | `tests/functions/getPhoto.test.ts` | Unit | GET /api/photos/:id | `fixtures/photos.json` | 200, 404 |
| 18 | `tests/functions/deletePhoto.test.ts` | Unit | DELETE /api/photos/:id | `fixtures/photos.json` | 200, 403, 404 |
| 19 | `tests/functions/health.test.ts` | Unit | GET /api/health | Mock service health methods | Correct aggregate status |
| 20 | `tests/functions/openapi.test.ts` | Unit | GET /api/openapi.json | — | Valid OpenAPI 3.x |
| 21 | `src/web/tests/auth.test.tsx` | Unit | Auth flow (login, logout, token expiry) | Mock fetch | Auth state correct |
| 22 | `src/web/tests/routes.test.tsx` | Unit | Protected route redirect | Mock fetch | Redirect unauthenticated |
| 23 | `src/web/tests/scrapbook.test.tsx` | Unit | Photo list renders | Mock fetch | Photos displayed |
| 24 | `src/web/tests/upload.test.tsx` | Unit | Upload validation | Inline file data | Size/MIME checks |

---

## 11. Files to Generate

| File | Action | Description |
|------|--------|-------------|
| `.env.example` | CREATE | Environment variable template |
| `.gitignore` | CREATE | Node.js + Functions ignores |
| `package.json` | CREATE | Root workspace config |
| `src/functions/package.json` | CREATE | Backend dependencies |
| `src/functions/tsconfig.json` | CREATE | TypeScript config for Functions |
| `src/functions/jest.config.ts` | CREATE | Jest configuration |
| `src/functions/host.json` | CREATE | Azure Functions host config |
| `src/functions/local.settings.json` | CREATE | Local env config |
| `src/functions/src/services/config.ts` | CREATE | Config loader + env validation |
| `src/functions/src/services/interfaces/*.ts` | CREATE | Service contracts (3 files) |
| `src/functions/src/services/*.ts` | CREATE | Service implementations (4 files) |
| `src/functions/src/errors/*.ts` | CREATE | Error types and handler (3 files) |
| `src/functions/src/middleware/*.ts` | CREATE | Auth middleware, request logger (2 files) |
| `src/functions/src/logger.ts` | CREATE | Pino structured logger |
| `src/functions/src/functions/*.ts` | CREATE | Function handlers (13 files) |
| `src/functions/openapi.yaml` | CREATE | OpenAPI 3.x specification |
| `src/functions/tests/**` | CREATE | All test files (20 files) |
| `src/functions/tests/fixtures/*.json` | CREATE | Mock data fixtures (4 files) |
| `src/functions/tests/mocks/*.ts` | CREATE | Mock service implementations (3 files) |
| `src/functions/seeds/**` | CREATE | Migration + seed scripts |
| `src/shared/package.json` | CREATE | Shared package with build script + exports |
| `src/shared/tsconfig.json` | CREATE | TypeScript config for shared |
| `src/shared/types/*.ts` | CREATE | Entity types + API contracts (3 files) |
| `src/shared/schemas/*.ts` | CREATE | Zod validation schemas (4 files) |
| `src/web/package.json` | CREATE | Frontend dependencies |
| `src/web/tsconfig.json` | CREATE | TypeScript config for frontend |
| `src/web/vite.config.ts` | CREATE | Vite config with API proxy |
| `src/web/index.html` | CREATE | HTML entry point |
| `src/web/src/**` | CREATE | React components, pages, hooks |

---

## 12. Next Steps

**Current Phase**: Planning

**When current phase completes:**

1. **Set up local dev environment** — Run the **azure-local-development** skill to add Docker Compose emulators (Azurite + PostgreSQL), VS Code F5 debugging, and `docker-compose.yml`. The service abstraction layer generated here is fully compatible.

2. **Deploy to Azure** — Run **azure-prepare** → **azure-validate** → **azure-deploy**. The service abstraction layer ensures your code works against both local mocks and Azure services — no code changes needed.
