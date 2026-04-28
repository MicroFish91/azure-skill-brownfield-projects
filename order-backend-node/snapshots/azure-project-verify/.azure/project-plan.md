# Project Plan

**Status**: Scaffolded
**Created**: 2026-04-27
**Mode**: NEW

---

## 1. Project Overview

**Goal**: Build an "order processing" backend on Azure Functions (TypeScript). An HTTP endpoint accepts new orders and enqueues them onto an Azure Service Bus queue. A queue-triggered function consumes messages, validates the payload, and persists the order to Cosmos DB (NoSQL). A second HTTP endpoint fetches order status by ID. Every module is independently testable; all Azure clients are mocked in tests using `jest.mock`.

**App Type**: API only (HTTP + background worker)

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Runtime & Framework

| Component | Technology |
|-----------|-----------|
| **Runtime** | TypeScript (Node.js 20) |
| **Backend** | Azure Functions v4 (programming model) |
| **Frontend** | None |
| **Package Manager** | npm |

---

## 3. Test Runner & Configuration

| Component | Technology |
|-----------|-----------|
| **Test Runner** | jest (with `ts-jest`) |
| **Mocking Library** | `jest.mock` (all `@azure/*` clients mocked) |
| **Test Command** | `npm test` |
| **Coverage** | Unit tests (services, validation, handlers) + integration tests (HTTP + queue handlers wired with mock service registry) |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Azure Service Bus | Queue for new orders (`orders` queue) | `SERVICE_BUS_CONNECTION_STRING`, `SERVICE_BUS_ORDERS_QUEUE` | `Endpoint=sb://localhost/;SharedAccessKeyName=local;SharedAccessKey=local` / `orders` | Essential |
| Cosmos DB (NoSQL) | Persistent order store (`orders` container, partition key `/orderId`) | `COSMOSDB_CONNECTION_STRING`, `COSMOSDB_DATABASE`, `COSMOSDB_CONTAINER` | `AccountEndpoint=https://localhost:8081/;AccountKey=...` / `orders-db` / `orders` | Essential |
| Azure Storage (Functions runtime) | Required by Functions host | `AzureWebJobsStorage` | `UseDevelopmentStorage=true` | Essential |

---

## 5. Project Structure

```
project-root/
├── .azure/
│   └── project-plan.md
├── .env.example
├── .gitignore
├── package.json
├── src/
│   ├── functions/
│   │   ├── host.json
│   │   ├── local.settings.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.ts
│   │   ├── src/
│   │   │   ├── functions/
│   │   │   │   ├── createOrder.ts          ← POST /api/orders
│   │   │   │   ├── getOrder.ts             ← GET  /api/orders/{id}
│   │   │   │   ├── processOrder.ts         ← Service Bus queue trigger
│   │   │   │   └── health.ts               ← GET  /api/health
│   │   │   ├── services/
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── IOrderQueue.ts
│   │   │   │   │   └── IOrderRepository.ts
│   │   │   │   ├── serviceBusOrderQueue.ts
│   │   │   │   ├── cosmosOrderRepository.ts
│   │   │   │   ├── config.ts
│   │   │   │   └── registry.ts
│   │   │   ├── errors/
│   │   │   │   ├── AppError.ts
│   │   │   │   └── handleError.ts
│   │   │   └── middleware/
│   │   │       └── withErrorHandling.ts
│   │   └── tests/
│   │       ├── fixtures/
│   │       │   └── orders.ts
│   │       ├── mocks/
│   │       │   ├── serviceBus.mock.ts
│   │       │   ├── cosmos.mock.ts
│   │       │   └── registry.mock.ts
│   │       ├── services/
│   │       │   ├── serviceBusOrderQueue.test.ts
│   │       │   └── cosmosOrderRepository.test.ts
│   │       ├── functions/
│   │       │   ├── createOrder.test.ts
│   │       │   ├── getOrder.test.ts
│   │       │   ├── processOrder.test.ts
│   │       │   └── health.test.ts
│   │       ├── validation/
│   │       │   └── orderSchema.test.ts
│   │       └── integration/
│   │           └── orderFlow.integration.test.ts
│   └── shared/
│       ├── package.json
│       ├── types/
│       │   ├── entities.ts                  ← Order, OrderStatus
│       │   └── api.ts                       ← Response shapes + ErrorCode
│       └── schemas/
│           └── validation.ts                ← zod schemas + inferred request types
```

---

## 6. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Auth | Status Codes |
|---|--------|------|-------------|--------------|---------------|------|--------------|
| 1 | GET  | `/api/health`            | Health check (Service Bus + Cosmos reachability) | — | `{ status, services: { serviceBus, cosmos } }` | None | 200, 503 |
| 2 | POST | `/api/orders`            | Accept new order; validate shape; enqueue to Service Bus; respond with `orderId` and `status: "Pending"` (does NOT write to Cosmos directly) | `{ customerId, items: [{ sku, quantity, unitPrice }] }` | `{ orderId, status }` | None | 202, 422, 500 |
| 3 | GET  | `/api/orders/{id}`       | Fetch order status by `orderId` from Cosmos | — | `{ orderId, customerId, items, status, createdAt, updatedAt }` | None | 200, 404, 500 |

### Queue-Triggered Function

| # | Trigger | Source | Description | On Failure |
|---|---------|--------|-------------|-----------|
| Q1 | Service Bus Queue | `orders` queue | Re-validate message; write order to Cosmos DB with `status: "Validated"` (or `"Rejected"` on validation failure) | Validation errors → write `Rejected` order; transient errors → throw to allow Service Bus retry / dead-letter |

---

## 7. Database Constraints

Cosmos DB (NoSQL) is schema-less; constraints are enforced in code via zod schemas and repository logic.

| Container | Constraint Type | Field(s) | Detail |
|-----------|-----------------|----------|--------|
| `orders`  | Partition key   | `/orderId` | One logical partition per order |
| `orders`  | Uniqueness (logical) | `orderId` | Generated server-side (UUID v4); `createOrder` rejects client-supplied IDs |
| `orders`  | Enum (code-enforced) | `status` | `Pending` \| `Validated` \| `Rejected` |

### 7a. Collection-to-Container Name Mapping

| Collection Name (handler code) | Cosmos Container | Mapping Rule |
|--------------------------------|------------------|--------------|
| `'order'` | `orders` | pluralize |

---

## 8. Service Dependency Classification

| Service | Type | Failure Behavior |
|---------|------|------------------|
| Azure Service Bus | Essential | `POST /api/orders` returns 503 if enqueue fails |
| Cosmos DB | Essential | `GET /api/orders/{id}` returns 503 on read failure; queue trigger throws → Service Bus retry/DLQ |
| Azure Storage (Functions runtime) | Essential | Functions host fails to start without it |

---

## 9. Execution Checklist

> Detailed checklist auto-generated by `azure-project-scaffold`.

### High-Level Phases
- [ ] Step 1: Foundation (root `package.json`, `src/functions/` Functions project, `src/shared/` types package, build verification)
- [ ] Step 2: Configuration & Environment (`config.ts`, `.env.example`, `local.settings.json`, `host.json`)
- [ ] Step 3: Service Abstraction Layer (`IOrderQueue`, `IOrderRepository`, Service Bus + Cosmos implementations, `registry.ts`)
- [ ] Step 4: Cosmos DB bootstrap (idempotent database/container creation on first call)
- [ ] Step 5: Shared Types & zod Validation Schemas (`Order`, `CreateOrderRequest`, `OrderStatus`, error contracts)
- [ ] Step 6: Functions (`createOrder`, `getOrder`, `processOrder` queue trigger, `health`)
- [ ] Step 7: Error Handling Middleware (`withErrorHandling`, structured error response)
- [ ] Step 8: Health Check Endpoint
- [ ] Step 9: OpenAPI Contract (`openapi.yaml` for the two HTTP routes)
- [ ] Step 10: Structured Logging (correlation ID per request / message)
- [ ] Step 11: Tests — unit (services, validation, each handler) + integration (end-to-end order flow with mocked Service Bus and Cosmos clients)
- [ ] Step 12: Wrap Up (README run/test instructions)

---

## 10. Files to Generate

| File | Action | Description |
|------|--------|-------------|
| `package.json` | CREATE | Root npm workspace config |
| `.gitignore` | CREATE | Node + Functions ignores |
| `.env.example` | CREATE | Documents all required env vars |
| `src/functions/package.json` | CREATE | Functions deps (`@azure/functions`, `@azure/service-bus`, `@azure/cosmos`, `zod`) + dev deps (`jest`, `ts-jest`, `@types/jest`, `typescript`) |
| `src/functions/tsconfig.json` | CREATE | TS config for Functions v4 |
| `src/functions/jest.config.ts` | CREATE | jest + ts-jest, coverage thresholds |
| `src/functions/host.json` | CREATE | Functions host config |
| `src/functions/local.settings.json` | CREATE | Local env values (gitignored) |
| `src/functions/src/services/config.ts` | CREATE | Loads + validates env vars |
| `src/functions/src/services/interfaces/IOrderQueue.ts` | CREATE | Queue contract |
| `src/functions/src/services/interfaces/IOrderRepository.ts` | CREATE | Repository contract |
| `src/functions/src/services/serviceBusOrderQueue.ts` | CREATE | `@azure/service-bus` impl |
| `src/functions/src/services/cosmosOrderRepository.ts` | CREATE | `@azure/cosmos` impl |
| `src/functions/src/services/registry.ts` | CREATE | DI factory |
| `src/functions/src/errors/AppError.ts` | CREATE | Error class with `code` |
| `src/functions/src/errors/handleError.ts` | CREATE | Maps errors to HTTP responses |
| `src/functions/src/middleware/withErrorHandling.ts` | CREATE | Handler wrapper |
| `src/functions/src/functions/createOrder.ts` | CREATE | POST `/api/orders` |
| `src/functions/src/functions/getOrder.ts` | CREATE | GET `/api/orders/{id}` |
| `src/functions/src/functions/processOrder.ts` | CREATE | Service Bus queue trigger |
| `src/functions/src/functions/health.ts` | CREATE | GET `/api/health` |
| `src/shared/package.json` | CREATE | Shared types package |
| `src/shared/types/entities.ts` | CREATE | `Order`, `OrderStatus`, `OrderItem` |
| `src/shared/types/api.ts` | CREATE | Response types, `ErrorCode` union |
| `src/shared/schemas/validation.ts` | CREATE | zod schemas + inferred request types |
| `src/functions/tests/fixtures/orders.ts` | CREATE | Reusable order fixtures |
| `src/functions/tests/mocks/serviceBus.mock.ts` | CREATE | `jest.mock('@azure/service-bus')` helpers |
| `src/functions/tests/mocks/cosmos.mock.ts` | CREATE | `jest.mock('@azure/cosmos')` helpers |
| `src/functions/tests/mocks/registry.mock.ts` | CREATE | In-memory queue + repo for integration tests |
| `src/functions/tests/services/serviceBusOrderQueue.test.ts` | CREATE | Unit |
| `src/functions/tests/services/cosmosOrderRepository.test.ts` | CREATE | Unit |
| `src/functions/tests/validation/orderSchema.test.ts` | CREATE | Unit |
| `src/functions/tests/functions/createOrder.test.ts` | CREATE | Handler unit |
| `src/functions/tests/functions/getOrder.test.ts` | CREATE | Handler unit |
| `src/functions/tests/functions/processOrder.test.ts` | CREATE | Queue handler unit |
| `src/functions/tests/functions/health.test.ts` | CREATE | Handler unit |
| `src/functions/tests/integration/orderFlow.integration.test.ts` | CREATE | POST → queue → process → GET round-trip with mocked clients |
| `openapi.yaml` | CREATE | OpenAPI for HTTP routes |
| `README.md` | CREATE | Run + test instructions |

---

## 11. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-verify** for test coverage validation
3. Run **azure-local-development** for Service Bus + Cosmos emulators and VS Code F5
4. Run **azure-prepare** → **azure-deploy** when ready to deploy
