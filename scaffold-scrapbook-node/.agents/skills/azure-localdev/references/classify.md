# Classify Workspace

Determine project type(s) and runtime(s) to select correct scanning rules, emulator mappings, and launch configs.

> **Always scan full directory tree** — not just workspace root. Service roots in subdirectories (e.g. `./api/`, `./web/`) MUST be found regardless of layout.

---

## ⛔ MANDATORY: Run Classification Before Anything Else

Run detection tables below **in order** (first match wins per root). Classification produces array of service contexts — even single-service workspaces produce one-item array so rest of flow is uniform.

---

## Step 1: Detect Service Roots

Scan every subdirectory for these signals. Ignore: `node_modules/`, `.git/`, `dist/`, `build/`, `bin/`, `obj/`.

### Project Type Detection Table

> **Implementation status:** Only Azure Functions fully supported (emulators + launch config + tasks). Others stubbed.

| # | Detection Signals | Project Type | Status | Reference |
|---|-------------------|-------------|--------|-----------|
| 1 | `host.json` exists **AND** Azure Functions SDK in dependencies | **Azure Functions** | ✅ Implemented | [project-types/functions.md](project-types/functions.md) |
| 2 | `Dockerfile` exists **AND** no `host.json` in same directory | **Container App** | 🔲 Planned | Not yet implemented, Ask user or best-effort generic |
| 3 | Web framework detected (Express/Fastify/ASP.NET/FastAPI/Flask/Spring) **AND** no `host.json` **AND** no `Dockerfile` | **App Service** | 🔲 Planned | Not yet implemented |
| 4 | `.AppHost.csproj` or `Aspire.Hosting` package in `*.csproj` | **.NET Aspire** | 🔲 Planned | Not yet implemented |
| 5 | SPA framework detected (React/Vue/Angular/Svelte via `package.json`) **OR** `vite.config.*` / `next.config.*` / `angular.json` present **AND** no `host.json` | **Frontend SPA** | ✅ Implemented | No emulators needed; contributes a launch config + compound entry |
| ∞ | No match | **Unknown** | — | Ask user or best-effort generic |

> **Frontend SPA projects** don't need emulators or Azure bindings but **are** service roots. They contribute browser launch config (e.g., `chrome` type for Vite/React) and dev-server task. When frontend detected alongside backend, workspace is multi-service and **must** produce compound launch config.

> **🔲 Planned project types:** Stubs in place but not yet activated. When detected, inform user only emulator setup can be generated and check [project-types/{type}.md](project-types/) for status.

### Functions SDK Detection

Check for Azure Functions SDK after confirming `host.json` exists:

| Language | SDK Signal | Detection Command |
|----------|-----------|-------------------|
| Node.js / TypeScript | `@azure/functions` in `package.json` | `grep '"@azure/functions"' package.json` |
| .NET / C# | `Microsoft.NET.Sdk.Functions` in `*.csproj` | `grep 'Microsoft.NET.Sdk.Functions' *.csproj` |
| Python | `azure-functions` in `requirements.txt` | `grep 'azure-functions' requirements.txt` |
| Java | `azure-functions-java-library` in `pom.xml` | `grep 'azure-functions-java-library' pom.xml` |

---

## Step 2: Detect Runtime per Service Root

After identifying project type for root, determine language and runtime version:

| File Present | Runtime | Version Source | Launch Config Support |
|-------------|---------|---------------|----------------------|
| `package.json` (+ `tsconfig.json`) | **node-ts** | `engines.node` / `.nvmrc` / `.node-version` | ✅ Implemented |
| `package.json` (no TypeScript) | **node-ts** | Same | ✅ Implemented |
| `*.csproj` | **dotnet** | `<TargetFramework>` element | ⛔ Not yet implemented |
| `requirements.txt` / `pyproject.toml` | **python** | `.python-version` / `requires-python` | ⛔ Not yet implemented |
| `pom.xml` / `build.gradle` | **java** | `<java.version>` / `sourceCompatibility` | ⛔ Not yet implemented |
| `go.mod` | **go** | `go` directive | ⛔ Not yet implemented |

> **⛔ Unimplemented runtimes:** Proceed with emulator setup (language-agnostic). Skip `.vscode/launch.json` and `.vscode/tasks.json` generation; inform user to configure manually.

---

## Step 3: Determine Single-Service vs Multi-Service

Count service roots found:

| Result | Next Step |
|--------|-----------|
| **1 service root** | Proceed directly to [inventory.md](inventory.md) |
| **2+ service roots** | Proceed to [multi-service.md](multi-service.md) first, then [inventory.md](inventory.md) |

---

## Output Format

Always produce array (even for single-service workspaces):

**Single-service:**
```
services:
  - { root: ./, projectType: functions, runtime: node-ts }
```

**Multi-service (monorepo):**
```
services:
  - { root: ./api, projectType: functions,   runtime: node-ts }
  - { root: ./web, projectType: app-service,  runtime: node-ts }
```

Carry array into next phase. Do NOT read `project-types/` or `runtimes/` files here — classification only produces types and paths.
