# Multi-Service Orchestration

> **Phase 0b — runs only for multi-service workspaces or monorepos.**
> Single-service workspaces skip this file — output of `classify.md` is one-item array and all phases treat it identically.

---

## When This Runs

`classify.md` produces `services[]` array. If array has **more than one entry**, this phase runs between classify and inventory to assemble shared workspace context before discovery begins.

---

## Service ID Assignment

Each service root gets short ID used to namespace tasks and launch configs downstream. ID derived in priority order:

1. **Project manifest name** — read from project's package manager or build file, lowercased and kebab-cased:

   | Runtime | File | Field |
   |---------|------|-------|
   | node-ts | `package.json` | `"name"` |
   | dotnet | `*.csproj` | `<AssemblyName>`; falls back to the `.csproj` filename without extension |
   | python | `pyproject.toml` | `name` under `[project]` or `[tool.poetry]`; falls back to `[metadata].name` in `setup.cfg` |
   | java | `pom.xml` | `<artifactId>`; falls back to `rootProject.name` in `settings.gradle` |
   | go | `go.mod` | last path segment of the `module` directive |

2. **Directory name** — used when no manifest present or name field empty; lowercased and kebab-cased.

```
./api  (package.json "name": "payments-api")    → id: payments-api
./web  (package.json "name": "customer-portal") → id: customer-portal
./svc  (no package.json)                         → id: svc
```

If two services resolve to same ID after derivation, append project type: `payments-api-functions`, `payments-api-app-service`.

---

## Emulator Deduplication

1. Collect emulator lists from all service contexts
2. Deduplicate by name — each emulator appears once in `docker-compose.yml` regardless of how many services need it
3. Tag each emulator with service IDs that depend on it — used during connection string injection in generate

```yaml
sharedEmulators:
  - { name: azurite,  usedBy: [api, web] }
  - { name: cosmosdb, usedBy: [api] }
```

> Deduplication only affects compose output. Connection string injection still targets each service's config file independently.

---

## Workspace Root

Nearest common ancestor directory of all service roots. Shared artifacts written here:

- `docker-compose.yml`
- `emulators:start` / `emulators:stop` scripts
- VS Code compound launch configuration

---

## Port Assignment

When two or more services share same project type, each needs unique debug port. Assign sequentially from base port for that runtime:

| Runtime | Base Debug Port | Second Service | Third Service |
|---------|----------------|----------------|---------------|
| Functions / App Service (Node.js) | 9229 | 9230 | 9231 |
| Functions (.NET) | 5005 | 5006 | 5007 |
| App Service (Python) | 5678 | 5679 | 5680 |
| Java (JDWP) | 5005 | 5006 | 5007 |

Ports written into each service's `launch.json` entry. [global-rules.md](global-rules.md) performs final conflict check across all assigned ports before generate runs.

---

## Partial Configuration Handling

Check each service root for existing VS Code config before generating. Service is already configured if it has existing `launch.json` entry matching its service ID.

| State | Action |
|-------|--------|
| **Fully configured service** | Skip all artifact generation for that service; carry existing launch entry into compound config unchanged |
| **Partially configured service** | Generate only what is missing (e.g. tasks but no launch config → generate launch only) |
| **Unconfigured service** | Generate all artifacts as normal |

Adding second service to existing single-service repo is safe — original service's config preserved and new service added alongside.

---

## Output

Enriched workspace context passed to `inventory.md`:

```yaml
workspace:
  root: ./
  sharedEmulators:
    - { name: azurite,  usedBy: [api, web] }
    - { name: cosmosdb, usedBy: [api] }

services:
  - { id: api, root: ./api, projectType: functions,   runtime: node-ts }
  - { id: web, root: ./web, projectType: app-service,  runtime: node-ts }
```

---

## Compound Launch Config Shape

> **⛔ MANDATORY:** When 2+ service roots detected (including Frontend SPA projects), compound launch config **must** be generated. Frontend SPA counts as service root — doesn't need emulators but needs launch config entry and compound inclusion.

`generate.md` produces this compound config using service IDs from this phase:

```json
{
  "name": "Start All",
  "configurations": ["{id} (debug)", "..."],
  "preLaunchTask": "Start Emulators",
  "stopAll": true
}
```

One entry per service using assigned ID. `preLaunchTask` always points to shared "Start Emulators" task at workspace root.

### Frontend SPA Launch Entry

When Frontend SPA service root detected, add browser launch config and dev-server task:

```json
// launch.json configuration entry
{
  "name": "{id} (debug)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:{dev-server-port}",
  "webRoot": "${workspaceFolder}/{service-root}/src",
  "preLaunchTask": "{id} dev"
}
```

```json
// tasks.json task entry — Vite example (see framework table below for others)
{
  "type": "shell",
  "label": "{id} dev",
  "command": "npm run dev",
  "options": { "cwd": "${workspaceFolder}/{service-root}" },
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": { "regexp": "^$" },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "VITE",
      "endsPattern": "ready in \\d+"
    }
  }
}
```

> ⚠️ **IMPORTANT: Background tasks MUST have real `problemMatcher`.**
> Avoid `"problemMatcher": []` on task with `"isBackground": true`.
> Empty matcher causes VS Code to display blocking dialog:
> *"The task has not exited and doesn't have a 'problemMatcher' defined."*
> Always use framework-specific background matcher from table below.

### Framework Detection & Problem Matchers

| Framework | Default Dev Port | Detection | Background Problem Matcher |
|-----------|-----------------|----------|---------------------------|
| Vite | 5173 | `vite.config.*` or `vite` in devDependencies | `beginsPattern: "VITE"`, `endsPattern: "ready in \\d+"` |
| Next.js | 3000 | `next.config.*` or `next` in dependencies | `beginsPattern: "\\s*ready"`, `endsPattern: "started server on"` |
| Angular | 4200 | `angular.json` | `beginsPattern: "Compiling"`, `endsPattern: "Compiled successfully"` |
| Create React App | 3000 | `react-scripts` in dependencies | `beginsPattern: "Starting the development server"`, `endsPattern: "Compiled"` |

> All background problem matchers must include `"activeOnStart": true` and `"pattern"` with `"regexp": "^$"` (no-op error pattern). `owner` field should be framework name (lowercased).
