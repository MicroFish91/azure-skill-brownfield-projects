# Inventory Dependencies

Scan workspace to identify Azure service dependencies, emulator requirements, prerequisite tools, migration config, and manual test opportunities. This feeds directly into plan.

> For multi-service workspaces: loop over each service context in `services[]` from `classify.md`. Run steps 1–4 per service; deduplicate emulators and prerequisites across services using shared workspace context from [multi-service.md](multi-service.md).

---

## Step 1: Identify Azure Service Dependencies

Load discovery ruleset for current project type, then apply to workspace. Project type determines **how** to discover dependencies — binding scan vs SDK scan.

### 1.0. Project Plan: Authoritative Service List

If `.azure/project-plan.md` was detected in Phase 0, extract **§4 Services Required** table. Map each service to its emulator:

| Azure Service (from plan) | Emulator Reference |
|--------------------------|-------------------|
| Blob Storage | [emulators/azurite.md](emulators/azurite.md) |
| Queue Storage | [emulators/azurite.md](emulators/azurite.md) |
| Table Storage | [emulators/azurite.md](emulators/azurite.md) |
| PostgreSQL | [emulators/postgres.md](emulators/postgres.md) |
| CosmosDB | [emulators/cosmosdb.md](emulators/cosmosdb.md) |
| Redis | [emulators/redis.md](emulators/redis.md) |
| Azure SQL | [emulators/sql-edge.md](emulators/sql-edge.md) |

Also extract from plan:
- **Environment variables and default values** (§4) → use for `local.settings.json` and `.env` generation instead of generic defaults
- **Essential vs Enhancement classification** (§4/§8) → Essential services get health-check verification in validation; Enhancement services log warning if unavailable
- **Route definitions** (§6) → pre-populate manual test collection with correct paths, methods, and sample request bodies
- **Database constraints** (§7) → if migrations listed, use plan's table schema to validate migration content
- **Test runner** (§3) → use to configure correct test task in `tasks.json`

After extracting from plan, still run steps 1a–1c to detect **additional** services not in plan (e.g., services added after plan written). Merge results, plan takes precedence for conflicts.

### 1a. Functions: Binding Scan

For Azure Functions projects, parse `function.json` files **or** decorator/attribute-based bindings in source code.

> **Default: Azure emulators first.** Always prefer official Azure-provided emulator. Only fall back to third-party or generic container when no Azure emulator exists (e.g., PostgreSQL).

| Binding Type | Azure Service | Emulator Reference |
|-------------|---------------|-------------------|
| `blobTrigger`, `blob` (input/output) | Azure Blob Storage | [emulators/azurite.md](emulators/azurite.md) |
| `queueTrigger`, `queue` (output) | Azure Queue Storage | [emulators/azurite.md](emulators/azurite.md) |
| `tableTrigger`, `table` (input/output) | Azure Table Storage | [emulators/azurite.md](emulators/azurite.md) |
| `httpTrigger` | (none — built into Functions host) | — |
| `timerTrigger` | (none — built into Functions host) | — |
| `cosmosDBTrigger`, `cosmosDB` (input/output) | Azure Cosmos DB | [emulators/cosmosdb.md](emulators/cosmosdb.md) |
| `serviceBusTrigger`, `serviceBus` (output) | Azure Service Bus | [emulators/servicebus.md](emulators/servicebus.md) |
| `eventHubTrigger`, `eventHub` (output) | Azure Event Hubs | [emulators/eventhubs.md](emulators/eventhubs.md) |
| `signalR`, `signalRConnectionInfo` | Azure SignalR | No local emulator — use dev-tier Azure instance |
| `sql`, `sqlTrigger` | Azure SQL | [emulators/sql-edge.md](emulators/sql-edge.md) |

### 1b. Container App / App Service: SDK Scan

For non-Functions projects, scan dependency files for Azure SDK packages that imply service usage.

| Package Pattern | Azure Service | Emulator Reference |
|----------------|---------------|-------------------|
| `@azure/storage-blob`, `@azure/storage-queue` | Azure Storage | [emulators/azurite.md](emulators/azurite.md) |
| `@azure/cosmos` | Cosmos DB | [emulators/cosmosdb.md](emulators/cosmosdb.md) |
| `@azure/service-bus` | Service Bus | [emulators/servicebus.md](emulators/servicebus.md) |
| `@azure/event-hubs` | Event Hubs | [emulators/eventhubs.md](emulators/eventhubs.md) |
| `@azure/data-tables` | Table Storage | [emulators/azurite.md](emulators/azurite.md) |
| `mssql`, `tedious` | Azure SQL | [emulators/sql-edge.md](emulators/sql-edge.md) |
| `pg`, `postgres`, `@prisma/client` (postgres provider) | PostgreSQL¹ | [emulators/postgres.md](emulators/postgres.md) |

> ¹ PostgreSQL has no Azure-provided emulator. If project targets **Azure Cosmos DB for PostgreSQL**, note that no local emulator is available — flag in plan.

### 1c. Connection String Scan

Look for connection references in `local.settings.json`, `.env`, or app configuration:

```bash
# Check local.settings.json for connection values
cat local.settings.json 2>/dev/null | grep -i "connection\|storage\|database\|cosmos\|sql\|servicebus"

# Check .env files
cat .env .env.local .env.development 2>/dev/null | grep -i "connection\|storage\|database"
```

---

## Step 2: Detect Database Migrations

When database dependency detected, scan for migration evidence using **three-layer detection** in [migrations.md](migrations.md):

1. **Layer 1 — Migration Files:** Look for migration dirs and files (`migrations/*.sql`, `prisma/migrations/`, `drizzle/`, JS/TS migration files, etc.)
2. **Layer 2 — Dependencies:** Check `dependencies` and `devDependencies` for migration tool packages
3. **Layer 3 — Existing Scripts:** Check script runners for migration-related commands

```bash
# Layer 1: Check for migration files
ls migrations/*.sql 2>/dev/null && echo "FOUND: Raw SQL migrations"
test -d prisma/migrations && echo "FOUND: Prisma migrations directory"
test -f prisma/schema.prisma && echo "FOUND: Prisma schema"
test -d drizzle && echo "FOUND: Drizzle migrations directory"
test -f drizzle.config.ts -o -f drizzle.config.js 2>/dev/null && echo "FOUND: Drizzle config"
test -f knexfile.js -o -f knexfile.ts 2>/dev/null && echo "FOUND: Knex config"
ls migrations/*.ts migrations/*.js 2>/dev/null && echo "FOUND: JS/TS migration files"

# Layer 2: Check dependencies and devDependencies
node -e "const p=require('./package.json'); const all={...p.dependencies,...p.devDependencies}; ['prisma','@prisma/client','knex','drizzle-kit','drizzle-orm','typeorm','sequelize','sequelize-cli','node-pg-migrate','db-migrate'].forEach(d => { if(all[d]) console.log('DEP:', d, all[d]) })" 2>/dev/null

# Layer 3: Check for existing migration scripts
node -e "const s=require('./package.json').scripts||{}; Object.entries(s).filter(([k,v])=>/migrat|prisma|knex|drizzle|typeorm|sequelize|db-migrate|schema/i.test(k+v)).forEach(([k,v])=>console.log('SCRIPT:', k, '→', v))" 2>/dev/null
```

Cross-reference all three layers per [migrations.md § Synthesis](migrations.md):

- If evidence consistent → record tool and command
- If evidence conflicts (multiple tools detected) → **ask user** which is active
- If database dependency exists but **no migration evidence found** → **ask user** how they manage schema changes (do not guess)

---

## Step 3: Detect Existing Configuration

Check which local-dev artifacts already exist in workspace:

| File | Status Values |
|------|--------------|
| `.vscode/launch.json` | Found / Not found |
| `.vscode/tasks.json` | Found / Not found |
| `docker-compose.yml` or `docker-compose.yaml` | Found / Not found |
| `local.settings.json` (Functions) | Found / Not found |
| `.env` / `.env.local` | Found / Not found |
| `manualTestCollections/` | Found / Not found |
| `migrations/` or ORM config | Found / Not found |
| `scripts/db-migrate.sh` | Found / Not found |

If existing config found, note in plan — generate phase must **merge**, not overwrite.

---

## Step 4: Detect Prerequisites

Check for required tools on developer's machine. Only check tools relevant to detected project type and runtime.

| Tool | Detection Command | Required For |
|------|-------------------|-------------|
| Node.js | `node --version` | Node.js / TypeScript projects |
| npm | `npm --version` | Node.js dependency management |
| Azure Functions Core Tools | `func --version` | Running Functions host locally |
| Docker | `docker --version` | Running emulators |
| Docker Compose | `docker compose version` | Orchestrating emulators |
| .NET SDK | `dotnet --version` | .NET projects (⛔ launch config not yet in runtimes/dotnet.md) |
| Python | `python3 --version` | Python projects (⛔ launch config not yet in runtimes/python.md) |
| Java / Maven | `mvn --version` | Java projects (⛔ launch config not yet in runtimes/java.md) |
| Azure CLI | `az --version` | Some manual test scripts |

---

## Step 5: Discover Manual Test Opportunities

Identify endpoints and triggers that benefit from test scripts.

### HTTP Triggers

List all HTTP-triggered functions with their routes and methods:

```markdown
| Function | Route | Method | Auth Level |
|----------|-------|--------|------------|
| HealthCheck | /api/HealthCheck | GET | anonymous |
| ProcessOrder | /api/ProcessOrder | POST | function |
```

### Non-HTTP Triggers

List triggers that need sample data or invocation scripts:

```markdown
| Function | Trigger Type | Required Data |
|----------|-------------|---------------|
| ProcessBlob | blobTrigger | Sample blob upload to `uploads` container |
| HandleMessage | queueTrigger | Sample queue message |
```

---

## Output

Consolidate findings into scan summary for plan:

```markdown
## Inventory Results

### Dependencies → Emulators

| Azure Service | Detected Via | Emulator | Reference |
|---------------|-------------|----------|-----------|
| Azure Blob Storage | blobTrigger binding | Azurite | emulators/azurite.md |
| PostgreSQL | `pg` package | postgres:16 | emulators/postgres.md |

### Existing Configuration

| File | Status |
|------|--------|
| .vscode/launch.json | Not found |
| docker-compose.yml | Not found |
| local.settings.json | Found |

### HTTP Endpoints

| Function | Route | Method |
|----------|-------|--------|
| HealthCheck | /api/HealthCheck | GET |

### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | Raw SQL |
| Migration Directory | `migrations/` |
| Target Database | PostgreSQL (`postgres` service) |

### Prerequisites

| Tool | Installed | Version |
|------|-----------|---------|
| Node.js | ✅ | v20.11.0 |
| Docker | ✅ | 24.0.7 |
| func | ❌ | — |
```
