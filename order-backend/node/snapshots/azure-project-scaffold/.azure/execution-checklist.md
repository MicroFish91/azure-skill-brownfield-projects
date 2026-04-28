# Execution Checklist

> Live progress tracker for `azure-project-scaffold`. Source: `.azure/project-plan.md` Section 9.

## Phases

- [x] Step 1: Foundation (root `package.json`, `src/functions/`, `src/shared/`, build verification)
- [x] Step 2: Configuration & Environment (`config.ts`, `.env.example`, `local.settings.json`, `host.json`)
- [x] Step 3: Service Abstraction Layer (interfaces, Service Bus + Cosmos impls, `registry.ts`)
- [x] Step 4: Cosmos DB bootstrap (idempotent database/container creation on first call)
- [x] Step 5: Shared Types & zod Schemas
- [x] Step 6: Functions (`createOrder`, `getOrder`, `processOrder`, `health`)
- [x] Step 7: Error Handling Middleware
- [x] Step 8: Health Check Endpoint
- [x] Step 9: OpenAPI Contract
- [x] Step 10: Structured Logging
- [x] Step 11: Tests — unit + integration with mocked Azure clients
- [x] Step 12: Wrap Up (build + smoke test + README)
