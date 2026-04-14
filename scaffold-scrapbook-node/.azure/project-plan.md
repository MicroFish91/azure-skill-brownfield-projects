# Project Plan

**Status**: Ready
**Created**: 2026-04-13
**Mode**: NEW

---

## 1. Project Overview

**Goal**: A couples photo scrapbook app where users sign in, pair with a partner, upload photos to a shared scrapbook, and receive AI-generated captions for each photo. The scrapbook UI presents photos in a visual, scrapbook-style layout. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Runtime & Framework

| Component | Technology |
|-----------|-----------|
| **Runtime** | TypeScript |
| **Backend** | Azure Functions v4 |
| **Frontend** | React + Vite |
| **Package Manager** | npm |

---

## 3. Test Runner & Configuration

| Component | Technology |
|-----------|-----------|
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Blob Storage | Store uploaded photos | `STORAGE_CONNECTION_STRING` | `UseDevelopmentStorage=true` | Essential |
| PostgreSQL | Primary data store (users, couples, photos metadata) | `DATABASE_URL` | `postgresql://localdev:localdevpassword@localhost:5432/scrapbookdb` | Essential |
| Azure OpenAI | Generate AI captions for uploaded photos | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` | _(no local emulator)_ | Enhancement |

---

## 5. Project Structure

```
project-root/
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
│   │   ├── src/
│   │   │   ├── functions/          ← One handler per file
│   │   │   │   ├── health.ts
│   │   │   │   ├── authRegister.ts
│   │   │   │   ├── authLogin.ts
│   │   │   │   ├── authMe.ts
│   │   │   │   ├── couplesCreate.ts
│   │   │   │   ├── couplesGet.ts
│   │   │   │   ├── couplesAccept.ts
│   │   │   │   ├── photosUpload.ts
│   │   │   │   ├── photosList.ts
│   │   │   │   ├── photosGet.ts
│   │   │   │   └── photosDelete.ts
│   │   │   ├── services/           ← Service abstraction layer
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── IStorageService.ts
│   │   │   │   │   ├── IDatabaseService.ts
│   │   │   │   │   ├── ICaptionService.ts
│   │   │   │   │   └── IAuthService.ts
│   │   │   │   ├── StorageService.ts
│   │   │   │   ├── DatabaseService.ts
│   │   │   │   ├── CaptionService.ts
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── registry.ts
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   └── errorHandler.ts
│   │   │   └── middleware/
│   │   │       └── authMiddleware.ts
│   │   ├── tests/
│   │   │   ├── fixtures/
│   │   │   │   ├── users.ts
│   │   │   │   ├── couples.ts
│   │   │   │   └── photos.ts
│   │   │   ├── mocks/
│   │   │   │   ├── mockStorageService.ts
│   │   │   │   ├── mockDatabaseService.ts
│   │   │   │   ├── mockCaptionService.ts
│   │   │   │   └── mockAuthService.ts
│   │   │   ├── services/
│   │   │   │   ├── StorageService.test.ts
│   │   │   │   ├── DatabaseService.test.ts
│   │   │   │   ├── CaptionService.test.ts
│   │   │   │   └── AuthService.test.ts
│   │   │   ├── functions/
│   │   │   │   ├── health.test.ts
│   │   │   │   ├── authRegister.test.ts
│   │   │   │   ├── authLogin.test.ts
│   │   │   │   ├── authMe.test.ts
│   │   │   │   ├── couplesCreate.test.ts
│   │   │   │   ├── couplesGet.test.ts
│   │   │   │   ├── couplesAccept.test.ts
│   │   │   │   ├── photosUpload.test.ts
│   │   │   │   ├── photosList.test.ts
│   │   │   │   ├── photosGet.test.ts
│   │   │   │   └── photosDelete.test.ts
│   │   │   └── validation/
│   │   │       └── schemas.test.ts
│   │   └── seeds/
│   │       └── seed.sql
│   ├── web/                        ← React frontend
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── api/client.ts       ← Typed API client
│   │       ├── components/
│   │       │   ├── ScrapbookPage.tsx
│   │       │   ├── PhotoCard.tsx
│   │       │   ├── UploadModal.tsx
│   │       │   ├── CoupleStatus.tsx
│   │       │   └── AuthForm.tsx
│   │       ├── pages/
│   │       │   ├── LoginPage.tsx
│   │       │   ├── RegisterPage.tsx
│   │       │   ├── ScrapbookPage.tsx
│   │       │   └── SettingsPage.tsx
│   │       └── hooks/
│   │           ├── useAuth.ts
│   │           ├── usePhotos.ts
│   │           └── useCouple.ts
│   └── shared/                     ← Shared types and schemas
│       ├── package.json
│       ├── types/
│       │   ├── entities.ts         ← Entity types (User, Couple, Photo)
│       │   └── api.ts              ← Response contracts + ErrorCode
│       └── schemas/
│           └── validation.ts       ← Zod schemas + inferred request types
```

---

## 6. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Auth | Status Codes |
|---|--------|------|-------------|-------------|--------------|------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | None | 200, 503 |
| 2 | POST | `/api/auth/register` | Register new user | `{ email, password, displayName }` | `{ user }` | None | 201, 409, 422 |
| 3 | POST | `/api/auth/login` | Login and get token | `{ email, password }` | `{ token, user }` | None | 200, 401, 422 |
| 4 | GET | `/api/auth/me` | Get current user | — | `{ user }` | Required | 200, 401 |
| 5 | POST | `/api/couples` | Create couple invitation | `{ partnerEmail }` | `{ couple }` | Required | 201, 404, 409, 422 |
| 6 | GET | `/api/couples/:id` | Get couple details | — | `{ couple, users }` | Required | 200, 403, 404 |
| 7 | POST | `/api/couples/:id/accept` | Accept couple invitation | — | `{ couple }` | Required | 200, 403, 404, 409 |
| 8 | POST | `/api/photos` | Upload photo (multipart) + auto-generate caption | `multipart/form-data { file }` | `{ photo }` | Required | 201, 403, 422 |
| 9 | GET | `/api/photos` | List photos for couple scrapbook | — | `{ photos[] }` | Required | 200, 403 |
| 10 | GET | `/api/photos/:id` | Get single photo details | — | `{ photo }` | Required | 200, 403, 404 |
| 11 | DELETE | `/api/photos/:id` | Delete a photo | — | `{ success }` | Required | 200, 403, 404 |

---

## 7. Database Constraints

| Table | Constraint Type | Column(s) | Detail |
|-------|----------------|-----------|--------|
| users | PK | id | UUID, auto-generated |
| users | UNIQUE | email | Prevent duplicate registration |
| users | FK | couple_id → couples.id | ON DELETE SET NULL |
| couples | PK | id | UUID, auto-generated |
| couples | FK | user1_id → users.id | ON DELETE CASCADE |
| couples | FK | user2_id → users.id | ON DELETE CASCADE |
| couples | CHECK | status | IN ('pending', 'accepted', 'declined') |
| photos | PK | id | UUID, auto-generated |
| photos | FK | couple_id → couples.id | ON DELETE CASCADE |
| photos | FK | uploaded_by → users.id | ON DELETE SET NULL |

### 7a. Collection-to-Table Name Mapping

| Collection Name (handler code) | SQL Table Name (migration) | Mapping Rule |
|-------------------------------|---------------------------|--------------|
| `'user'` | `users` | camelToSnake + pluralize |
| `'couple'` | `couples` | camelToSnake + pluralize |
| `'photo'` | `photos` | camelToSnake + pluralize |

---

## 8. Service Dependency Classification

| Service | Type | Failure Behavior |
|---------|------|-----------------|
| PostgreSQL | Essential | Request fails with 503 |
| Blob Storage | Essential | Photo upload/retrieval fails with 503 |
| Azure OpenAI | Enhancement | Falls back to empty caption string, logs warning |

---

## 9. Execution Checklist

> The detailed execution checklist is auto-generated by `azure-project-scaffold` when it begins execution. It copies this section's high-level phases and expands them into step-by-step items with build gates.

### High-Level Phases
- [ ] Step 1: Foundation (project config, directory structure, build verification)
- [ ] Step 2: Configuration & Environment (config module, .env, local.settings.json)
- [ ] Step 3: Service Abstraction Layer (interfaces + concrete implementations + registry)
- [ ] Step 4: Database Schema & Migrations (users, couples, photos tables)
- [ ] Step 5: Shared Types & Validation Schemas (entities, API contracts, Zod schemas)
- [ ] Step 6: API Routes / Functions (auth, couples, photos — one handler per route)
- [ ] Step 7: Error Handling Middleware
- [ ] Step 8: Health Check Endpoint
- [ ] Step 9: OpenAPI Contract
- [ ] Step 10: Structured Logging
- [ ] Step 11: Wire Frontend (React scrapbook UI with auth, upload, photo grid)
- [ ] Step 12: Wrap Up & Smoke Test

---

## 10. Test Suite Plan

| # | Test File | Type | Tests | Pass Criteria |
|---|-----------|------|-------|---------------|
| 1 | tests/functions/health.test.ts | Unit | Health endpoint returns status + service checks | 200 when all services up, 503 when any essential service down |
| 2 | tests/functions/authRegister.test.ts | Unit | Registration with valid/invalid/duplicate email | 201 created, 422 validation error, 409 conflict |
| 3 | tests/functions/authLogin.test.ts | Unit | Login with correct/wrong credentials | 200 + token, 401 invalid credentials |
| 4 | tests/functions/authMe.test.ts | Unit | Get current user with/without token | 200 with user, 401 unauthorized |
| 5 | tests/functions/couplesCreate.test.ts | Unit | Create couple invitation | 201 created, 404 partner not found, 409 already coupled |
| 6 | tests/functions/couplesGet.test.ts | Unit | Get couple details, auth checks | 200 with details, 403 forbidden, 404 not found |
| 7 | tests/functions/couplesAccept.test.ts | Unit | Accept/reject invitation | 200 accepted, 403 forbidden, 409 already accepted |
| 8 | tests/functions/photosUpload.test.ts | Unit | Upload photo with caption generation + fallback | 201 with photo + caption, 201 with empty caption on AI failure |
| 9 | tests/functions/photosList.test.ts | Unit | List couple's photos | 200 with photos array, 403 no couple |
| 10 | tests/functions/photosGet.test.ts | Unit | Get single photo | 200 with photo, 403 forbidden, 404 not found |
| 11 | tests/functions/photosDelete.test.ts | Unit | Delete photo and blob | 200 success, 403 forbidden, 404 not found |
| 12 | tests/services/StorageService.test.ts | Unit | Blob upload, download, delete operations | Calls correct SDK methods with correct params |
| 13 | tests/services/DatabaseService.test.ts | Unit | CRUD operations for users, couples, photos | Executes correct SQL queries, handles errors |
| 14 | tests/services/CaptionService.test.ts | Unit | AI caption generation + fallback on failure | Returns caption string, returns empty on error |
| 15 | tests/services/AuthService.test.ts | Unit | Token generation, verification, password hashing | Valid tokens, password match/mismatch, token expiry |
| 16 | tests/validation/schemas.test.ts | Unit | Zod schema validation for all request bodies | Accepts valid, rejects invalid with correct errors |

---

## 11. Files to Generate

| File | Action | Description |
|------|--------|-------------|
| `package.json` | CREATE | Root workspace config with npm workspaces |
| `.env.example` | CREATE | Environment variable template |
| `.gitignore` | CREATE | Git ignore rules |
| `src/functions/host.json` | CREATE | Azure Functions host config |
| `src/functions/local.settings.json` | CREATE | Local settings with connection strings |
| `src/functions/package.json` | CREATE | Backend dependencies (Azure Functions, pg, zod, etc.) |
| `src/functions/tsconfig.json` | CREATE | TypeScript config for backend |
| `src/functions/src/functions/health.ts` | CREATE | Health check endpoint |
| `src/functions/src/functions/authRegister.ts` | CREATE | User registration handler |
| `src/functions/src/functions/authLogin.ts` | CREATE | User login handler |
| `src/functions/src/functions/authMe.ts` | CREATE | Get current user handler |
| `src/functions/src/functions/couplesCreate.ts` | CREATE | Create couple invitation handler |
| `src/functions/src/functions/couplesGet.ts` | CREATE | Get couple details handler |
| `src/functions/src/functions/couplesAccept.ts` | CREATE | Accept couple invitation handler |
| `src/functions/src/functions/photosUpload.ts` | CREATE | Photo upload with AI captioning handler |
| `src/functions/src/functions/photosList.ts` | CREATE | List couple photos handler |
| `src/functions/src/functions/photosGet.ts` | CREATE | Get single photo handler |
| `src/functions/src/functions/photosDelete.ts` | CREATE | Delete photo handler |
| `src/functions/src/services/interfaces/IStorageService.ts` | CREATE | Blob storage service contract |
| `src/functions/src/services/interfaces/IDatabaseService.ts` | CREATE | Database service contract |
| `src/functions/src/services/interfaces/ICaptionService.ts` | CREATE | AI caption service contract |
| `src/functions/src/services/interfaces/IAuthService.ts` | CREATE | Auth service contract |
| `src/functions/src/services/StorageService.ts` | CREATE | Blob Storage implementation |
| `src/functions/src/services/DatabaseService.ts` | CREATE | PostgreSQL implementation |
| `src/functions/src/services/CaptionService.ts` | CREATE | Azure OpenAI captioning implementation |
| `src/functions/src/services/AuthService.ts` | CREATE | JWT auth implementation |
| `src/functions/src/services/config.ts` | CREATE | Environment config loader + validation |
| `src/functions/src/services/registry.ts` | CREATE | Service factory / DI registry |
| `src/functions/src/errors/AppError.ts` | CREATE | Custom error types |
| `src/functions/src/errors/errorHandler.ts` | CREATE | Error handling middleware |
| `src/functions/src/middleware/authMiddleware.ts` | CREATE | JWT auth middleware |
| `src/functions/tests/fixtures/users.ts` | CREATE | User test fixtures |
| `src/functions/tests/fixtures/couples.ts` | CREATE | Couple test fixtures |
| `src/functions/tests/fixtures/photos.ts` | CREATE | Photo test fixtures |
| `src/functions/tests/mocks/mockStorageService.ts` | CREATE | Mock storage service |
| `src/functions/tests/mocks/mockDatabaseService.ts` | CREATE | Mock database service |
| `src/functions/tests/mocks/mockCaptionService.ts` | CREATE | Mock caption service |
| `src/functions/tests/mocks/mockAuthService.ts` | CREATE | Mock auth service |
| `src/functions/tests/services/StorageService.test.ts` | CREATE | Storage service tests |
| `src/functions/tests/services/DatabaseService.test.ts` | CREATE | Database service tests |
| `src/functions/tests/services/CaptionService.test.ts` | CREATE | Caption service tests |
| `src/functions/tests/services/AuthService.test.ts` | CREATE | Auth service tests |
| `src/functions/tests/functions/health.test.ts` | CREATE | Health endpoint tests |
| `src/functions/tests/functions/authRegister.test.ts` | CREATE | Registration tests |
| `src/functions/tests/functions/authLogin.test.ts` | CREATE | Login tests |
| `src/functions/tests/functions/authMe.test.ts` | CREATE | Get current user tests |
| `src/functions/tests/functions/couplesCreate.test.ts` | CREATE | Create couple tests |
| `src/functions/tests/functions/couplesGet.test.ts` | CREATE | Get couple tests |
| `src/functions/tests/functions/couplesAccept.test.ts` | CREATE | Accept couple tests |
| `src/functions/tests/functions/photosUpload.test.ts` | CREATE | Photo upload tests |
| `src/functions/tests/functions/photosList.test.ts` | CREATE | List photos tests |
| `src/functions/tests/functions/photosGet.test.ts` | CREATE | Get photo tests |
| `src/functions/tests/functions/photosDelete.test.ts` | CREATE | Delete photo tests |
| `src/functions/tests/validation/schemas.test.ts` | CREATE | Validation schema tests |
| `src/functions/seeds/seed.sql` | CREATE | Database seed data |
| `src/web/package.json` | CREATE | Frontend dependencies |
| `src/web/vite.config.ts` | CREATE | Vite config with API proxy |
| `src/web/src/api/client.ts` | CREATE | Typed API client |
| `src/web/src/components/ScrapbookPage.tsx` | CREATE | Scrapbook layout component |
| `src/web/src/components/PhotoCard.tsx` | CREATE | Photo card with caption |
| `src/web/src/components/UploadModal.tsx` | CREATE | Photo upload modal |
| `src/web/src/components/CoupleStatus.tsx` | CREATE | Couple pairing status |
| `src/web/src/components/AuthForm.tsx` | CREATE | Login/register form |
| `src/web/src/pages/LoginPage.tsx` | CREATE | Login page |
| `src/web/src/pages/RegisterPage.tsx` | CREATE | Registration page |
| `src/web/src/pages/ScrapbookPage.tsx` | CREATE | Main scrapbook page |
| `src/web/src/pages/SettingsPage.tsx` | CREATE | Settings/couple management |
| `src/web/src/hooks/useAuth.ts` | CREATE | Auth hook |
| `src/web/src/hooks/usePhotos.ts` | CREATE | Photos hook |
| `src/web/src/hooks/useCouple.ts` | CREATE | Couple hook |
| `src/shared/package.json` | CREATE | Shared types package |
| `src/shared/types/entities.ts` | CREATE | Entity interfaces |
| `src/shared/types/api.ts` | CREATE | Response contracts + ErrorCode |
| `src/shared/schemas/validation.ts` | CREATE | Zod schemas + inferred request types |

---

## 12. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-localdev** for Docker emulators and VS Code debugging
3. Run **azure-prepare** → **azure-deploy** when ready to deploy
