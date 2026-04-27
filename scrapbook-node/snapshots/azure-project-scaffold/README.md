# Couples Scrapbook

A two-person shared photo scrapbook with AI-generated captions. Built on Azure Functions (TypeScript), React + Vite, PostgreSQL, Azure Blob Storage, Azure OpenAI, and Microsoft Entra ID.

## Quick Start

```bash
npm install
npm run build
# Backend
npm run start:functions   # localhost:7071
# Frontend
npm run start:web         # localhost:5173
```

## Project Structure

- `src/shared/` — entity types, API contracts, zod validation schemas
- `src/functions/` — Azure Functions v4 backend (services, handlers, migrations)
- `src/web/` — React + Vite SPA (MSAL auth, scrapbook UI)

## Architecture

| Service | Role | Classification |
|---------|------|----------------|
| PostgreSQL | Users / couples / photo metadata | Essential |
| Azure Blob Storage | Photo binaries | Essential |
| Microsoft Entra ID | Sign-in + JWT | Essential |
| Azure OpenAI (GPT-4o) | Photo caption generation | **Enhancement** (fallback caption on failure) |

See `.azure/project-plan.md` for the full design.

## Environment

Copy `.env.example` → `.env`, fill values. For local dev, defaults work with Azurite + local Postgres.

## Tests

```bash
npm test
```
