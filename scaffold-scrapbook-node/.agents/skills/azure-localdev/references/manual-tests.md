# Manual Test Patterns

> Reference for generating `manualTestCollections/` scripts. Scripts are language-agnostic shell commands (`curl`, Azure CLI) that exercise running app and emulators.
>
> **HTTP patterns** use `{baseUrl}` — project type supplies base URL (e.g., `http://localhost:7071/api` for Functions). Other patterns target emulator directly and are reusable across project types.

---

## HTTP

### GET request

```sh
#!/bin/bash
curl -i "{baseUrl}/{FunctionName}"
```

### POST with JSON body

```sh
#!/bin/bash
curl -i -X POST "{baseUrl}/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d @sample-data.json
```

> **`{baseUrl}` by project type:**
>
> | Project Type | Base URL |
> |-------------|---------|
> | Azure Functions | `http://localhost:7071/api` |
> | Container App | `http://localhost:{port}` (from Dockerfile `EXPOSE`) |
> | App Service | `http://localhost:{port}` (from framework dev server) |

---

## Storage (Azurite — Blob / Queue / Table)

> Requires Azurite running. Uses `--connection-string "UseDevelopmentStorage=true"` for all commands.

### Blob trigger — upload a file

```sh
#!/bin/bash
az storage blob upload \
  --connection-string "UseDevelopmentStorage=true" \
  --container-name {container-name} \
  --name "sample-file.json" \
  --file sample-file.json \
  --overwrite
```

### Queue trigger — send a message

```sh
#!/bin/bash
az storage message put \
  --connection-string "UseDevelopmentStorage=true" \
  --queue-name {queue-name} \
  --content '{"id": "test-001", "data": "sample"}'
```

### Table trigger — insert an entity

```sh
#!/bin/bash
az storage entity insert \
  --connection-string "UseDevelopmentStorage=true" \
  --table-name {table-name} \
  --entity PartitionKey=pk RowKey=rk001 Value=test
```

---

## Cosmos DB

> Requires Cosmos DB Emulator running on `https://localhost:8081`. TLS verification must be disabled for local calls.

### Insert a document

```sh
#!/bin/bash
curl -k -X POST "https://localhost:8081/dbs/{database}/colls/{collection}/docs" \
  -H "Authorization: type=master&ver=1.0&sig=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==" \
  -H "Content-Type: application/json" \
  -H "x-ms-documentdb-partitionkey: [\"test\"]" \
  -H "x-ms-version: 2018-12-31" \
  -d '{"id": "test-001", "partitionKey": "test", "data": "sample"}'
```

> `-k` disables TLS verification for emulator's self-signed cert. NEVER use in production.

---

## Service Bus

> Requires Service Bus Emulator running. Uses the `az servicebus` CLI or the Service Bus REST API.

### Send a message to a queue

```sh
#!/bin/bash
az servicebus queue message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --queue-name {queue-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

### Send a message to a topic

```sh
#!/bin/bash
az servicebus topic message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --topic-name {topic-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Event Hubs

> Requires Event Hubs Emulator running.

### Send an event

```sh
#!/bin/bash
az eventhubs eventhub message send \
  --connection-string "Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;" \
  --eventhub-name {eventhub-name} \
  --body '{"id": "test-001", "data": "sample"}'
```

---

## Timer (Azure Functions only)

Timer triggers cannot be fired by external event — Functions host fires them on schedule. Use Functions admin API to trigger on demand:

```sh
#!/bin/bash
curl -i -X POST "http://localhost:7071/admin/functions/{FunctionName}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

> This calls Functions admin endpoint, only available locally. `{}` body is required; timer trigger ignores it.

---

## Generation Rules

When generating `manualTestCollections/` during Phase 2:

1. Generate one subdirectory per trigger/endpoint found during inventory
2. Name directory after trigger: `{trigger-type}-{function-or-endpoint-name}` (e.g., `http-GetOrder`, `blob-ProcessUpload`)
3. Create `invoke.sh` with appropriate pattern from this file, substituting discovered values (function name, container name, queue name, etc.)
4. Create `sample-data.json` or `sample-message.json` next to `invoke.sh` when test requires body
5. `chmod +x invoke.sh`

> **Do not generate timer test scripts** unless user explicitly requests — rarely needed for local debugging.

---

## Plan Section Formatting Rules

When writing **Manual Tests** section of plan, heading format may vary by trigger type. Subfolder names under `manualTestCollections/` (e.g., `http-register`, `http-createOrder`) should also be referenced in each section's markdown heading when they differ so users can see which routes map to each script.

---

### HTTP triggers / web API endpoints

```
### {METHOD} {route} [{🔒}] `{folder-name}`
```

- **`{METHOD} {route}`** — HTTP verb and full route path (e.g., `GET /api/health`)
- **`🔒`** — Include when endpoint requires authentication (any auth scheme: Bearer JWT, API key, etc.). Omit for anonymous/public endpoints.
- **`` `{folder-name}` ``** — Exact folder name under `manualTestCollections/` (e.g., `` `http-health` ``)

**Examples:**

```markdown
### GET /api/health `http-health`

### POST /api/auth/register `http-register`

### GET /api/auth/me 🔒 `http-getMe`

### POST /api/orders 🔒 `http-createOrder`
```

**Auth key** — add once at top of Manual Tests section, just after folder tree, when any 🔒 routes present:

```markdown
> 🔒 = requires authentication (replace `<token>` with a JWT from the login endpoint before running)
```

---

### Non-HTTP triggers (blob, queue, Service Bus, Event Hubs, etc.)

```
### {TriggerType}: {function-or-resource-name} `{folder-name}`
```

- **`{TriggerType}`** — Human-readable trigger category: `Blob`, `Queue`, `Service Bus`, `Event Hubs`, `Table`, `Cosmos DB`, etc.
- **`{function-or-resource-name}`** — Function name or specific resource targeted (container name, queue name, topic name, etc.)
- **`` `{folder-name}` ``** — Exact folder name under `manualTestCollections/` (e.g., `` `blob-ProcessUpload` ``)

**Examples:**

```markdown
### Blob: uploads container `blob-processUpload`

### Queue: order-requests `queue-sendOrder`

### Service Bus: invoices topic `servicebus-sendInvoice`

### Event Hubs: telemetry `eventhubs-sendTelemetry`
```

> 🔒 indicator does not apply to non-HTTP triggers — invoked by pushing data into resource directly, not via authenticated HTTP call.
