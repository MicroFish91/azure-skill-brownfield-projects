# Order Processing — Azure Functions (TypeScript)

Event-driven order processing backend on Azure Functions, Service Bus, and Cosmos DB (NoSQL).

## Architecture

```
HTTP POST /api/orders ──► Service Bus (orders queue) ──► processOrder ──► Cosmos DB
                                                                              ▲
HTTP GET  /api/orders/{id} ──────────────────────────────────────────────────┘
```

| Endpoint | Method | Description |
|----------|:------:|-------------|
| `/api/health` | GET | Liveness/readiness for Service Bus + Cosmos |
| `/api/orders` | POST | Validate, enqueue, return `{ orderId, status: "Pending" }` |
| `/api/orders/{id}` | GET | Look up by `orderId` |

The Service Bus queue trigger `processOrder` re-validates each message, then writes the order to Cosmos with `status: "Validated"` (or `"Rejected"` on validation failure). Cosmos write failures throw, allowing Service Bus retry / dead-letter.

## Project layout

- [src/shared](src/shared) — Entity types, API contracts, zod schemas (`@app/shared` workspace)
- [src/functions](src/functions) — Azure Functions v4 project
  - [src/functions/src/services](src/functions/src/services) — Interfaces + Service Bus and Cosmos implementations + DI registry
  - [src/functions/src/functions](src/functions/src/functions) — One handler per file
  - [src/functions/src/errors](src/functions/src/errors) — `AppError` types and HTTP error mapping
  - [src/functions/src/middleware](src/functions/src/middleware) — `withErrorHandling`
  - [src/functions/tests](src/functions/tests) — jest unit + integration tests (all `@azure/*` clients mocked)
- [src/functions/openapi.yaml](src/functions/openapi.yaml) — OpenAPI 3 contract

## Prerequisites

- Node.js 20+
- Azure Functions Core Tools v4 (`npm i -g azure-functions-core-tools@4`)

## Install & build

```bash
npm install
npm run build
```

## Run locally

Edit [src/functions/local.settings.json](src/functions/local.settings.json) to point at your Service Bus and Cosmos endpoints (Azurite + Cosmos emulator work for the Functions runtime + Cosmos; Service Bus has no local emulator — use a dev namespace).

```bash
cd src/functions
npm start
```

## Test

```bash
npm test                # all tests
npm run test:coverage   # with coverage report
```

All Azure SDK clients are mocked via `jest.mock`. Tests are organized as:

| Path | What it covers |
|------|----------------|
| `tests/services/` | Service Bus + Cosmos implementations, DI registry |
| `tests/validation/` | zod schemas |
| `tests/functions/` | Each handler in isolation against an in-memory queue/repo |
| `tests/integration/` | End-to-end POST → queue → process → GET round-trip |

## Environment variables

| Name | Required | Default (local) |
|------|:--------:|-----------------|
| `SERVICE_BUS_CONNECTION_STRING` | yes | — |
| `SERVICE_BUS_ORDERS_QUEUE` | yes | `orders` |
| `COSMOSDB_CONNECTION_STRING` | yes | Cosmos emulator |
| `COSMOSDB_DATABASE` | yes | `orders-db` |
| `COSMOSDB_CONTAINER` | yes | `orders` |
| `LOG_LEVEL` | no | `info` |

See [.env.example](.env.example).
