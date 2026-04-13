# Node.js / TypeScript — Debug & Build Configuration

## Prerequisites

| Tool | Detection Command | Required For | Install Link |
|------|-------------------|-------------|-------------|
| Node.js | `node --version` | All Node/TS projects | [nodejs.org](https://nodejs.org/) |
| npm | `npm --version` | Dependency management | (bundled with Node) |

---

## Debugger Fragment

Fields contributed to `launch.json` by this runtime. `preLaunchTask` and config name set by project type's Runtime Wiring table — see [project-types/{type}.md § Runtime Wiring](../project-types/).

```json
{
  "type": "node",
  "request": "attach",
  "port": 9229,
  "restart": true
}
```

| Field | Value | Why |
|-------|-------|-----|
| `type` | `"node"` | Node.js debugger |
| `request` | `"attach"` | The host process spawns Node; we attach to it |
| `port` | `9229` | Default Node.js inspector port |
| `restart` | `true` | Re-attach after the host restarts on file changes |

> **Monorepo / multi-service:** When multiple Node services present, each gets sequential debug port starting from base port in project type's Runtime Wiring table. See [multi-service.md](../multi-service.md) for port assignment rules.

---

## Build Chain Tasks

Tasks owned by this runtime: install, clean, build, watch. Host-start task and its `dependsOn` wiring provided by project type's Runtime Wiring table — not this file.

Chain shape (host-start task comes from project type):

```
"{host start task}"              ← from project-types/{type}.md Runtime Wiring
       ├── dependsOn: "npm watch"
       │                └── dependsOn: "npm clean"
       │                               └── dependsOn: "npm install"
       └── dependsOn: "Start Emulators"
```

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "shell",
      "label": "Start Emulators",
      "command": "docker compose down && docker compose up -d",
      "problemMatcher": []
    },
    {
      "type": "shell",
      "label": "npm watch",
      "command": "npm run watch",
      "dependsOn": "npm clean",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "type": "shell",
      "label": "npm build",
      "command": "npm run build",
      "dependsOn": "npm clean",
      "problemMatcher": "$tsc"
    },
    {
      "type": "shell",
      "label": "npm clean",
      "command": "npm run clean",
      "dependsOn": "npm install"
    },
    {
      "type": "shell",
      "label": "npm install",
      "command": "npm install"
    }
  ]
}
```

| Task | Type | Purpose | Background? |
|------|------|---------|------------|
| `Start Emulators` | `shell` | Runs `docker compose up -d` for all emulator services | No (completes immediately) |
| `npm watch` | `shell` | Runs `tsc --watch` via `npm run watch` for incremental builds | ✅ Yes — `$tsc-watch` |
| `npm build` | `shell` | One-shot build via `npm run build` (used outside F5 flow) | No — `$tsc` |
| `npm clean` | `shell` | Cleans build output via `npm run clean` | No |
| `npm install` | `shell` | Installs dependencies via `npm install` | No |

> **Monorepo / alternative package managers:** Adjust task labels and commands if project uses `yarn`, `pnpm`, or monorepo layout. Key invariant: **install → clean → build/watch → host start**.


---

## Convenience Scripts

Add to `package.json` `"scripts"`:

```json
{
  "emulators:start": "docker compose down && docker compose up -d",
  "emulators:stop": "docker compose down",
  "emulators:clean": "docker compose down && rm -rf {data-dirs}"
}
```

> **`{data-dirs}`** — Space-separated list of all `./.{name}` emulator data dirs from `docker-compose.yml`. Example: `.azurite .postgres` for Azurite + PostgreSQL. Derive from actual `volumes:` mounts — do not hardcode. See [generate.md](../generate.md) for derivation rules.

When migrations are detected, also add:

```json
{
  "db:migrate": "bash scripts/db-migrate.sh"
}
```

| Script | Location | Run Command |
|--------|----------|-------------|
| `emulators:start` | `package.json` scripts | `npm run emulators:start` |
| `emulators:stop` | `package.json` scripts | `npm run emulators:stop` |
| `emulators:clean` | `package.json` scripts | `npm run emulators:clean` |
| `db:migrate` | `package.json` scripts | `npm run db:migrate` |
