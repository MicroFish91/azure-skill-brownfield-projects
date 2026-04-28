# Global Rules

> **MANDATORY** — These rules apply to ALL actions by azure-localdev skill. Violations unacceptable.

## Rule 1: Destructive Actions Require User Confirmation

⛔ **ALWAYS use `ask_user`** before ANY destructive action.

### What is Destructive?

| Category | Examples |
|----------|----------|
| **Overwrite** | Replace existing `.vscode/launch.json`, `tasks.json`, `docker-compose.yml` |
| **Delete** | Remove existing emulator config, test collections, npm scripts |
| **Modify package.json** | Adding scripts, dependencies, or devDependencies |
| **Docker operations** | `docker compose down -v` (destroys volumes), pruning containers |
| **Port conflicts** | Binding to ports already in use by other services |

### How to Confirm

```
ask_user(
  question: "This will overwrite your existing .vscode/launch.json. Continue?",
  choices: ["Yes, overwrite", "No, merge with existing", "No, cancel"]
)
```

### No Exceptions

- Do NOT assume user wants to overwrite existing VS Code config
- Do NOT silently add npm scripts to `package.json`
- Do NOT start Docker containers without confirming
- Always prefer **merge** over **overwrite** when existing config detected

---

## Rule 2: Preserve Existing Configuration

When existing config detected:

| Found | Action |
|-------|--------|
| `.vscode/launch.json` exists | **Merge** new configurations into existing file; ask user if conflicts arise |
| `.vscode/tasks.json` exists | **Merge** new tasks into existing file; ask user if conflicts arise |
| `docker-compose.yml` exists | **Merge** new services into existing file; ask user if conflicts arise |
| `package.json` scripts exist | **Add** new scripts only if names don't collide; ask user on collision |

---

## Rule 3: Corrupted Emulator Data Recovery

When emulator container is stuck in crash-loop or reports init errors (e.g., Postgres `initdb: directory exists but is not empty`, Azurite returning 500 on blob writes, Cosmos DB emulator failing to start), local data volume is likely corrupt.

### First-Line Fix: `emulators:clean`

If project has `emulators:clean` script (see [generate.md § Convenience Scripts](generate.md)), suggest it first. Script stops all containers and wipes **all** emulator data dirs. User can run `emulators:start` to spin back up.

```
ask_user(
  question: "Emulator data appears corrupt. The quickest fix is `npm run emulators:clean` (or the equivalent for your ecosystem), which stops all containers and wipes all emulator data. You can then run `emulators:start` to spin them back up.\n\nAny manually inserted test data will be lost.",
  choices: [
    "Run emulators:clean for me",
    "Only wipe the affected emulator (keep other data)",
    "I'll investigate and fix it myself"
  ]
)
```

### Targeted Fix: Single Emulator

If user wants to preserve data from unaffected emulators, wipe only specific data dir for broken service. Identify correct dir from `volumes:` mount in `docker-compose.yml`:

| Emulator | Data Directory | Corruption Symptoms |
|----------|---------------|-------------------|
| Azurite | `.azurite/` | 500 errors on blob/queue/table writes; Functions host can't store secrets |
| PostgreSQL | `.postgres/` | `initdb: directory exists but is not empty`; crash-loop on startup |
| Cosmos DB | `.cosmosdb/` | Emulator fails to initialize; partition errors |
| SQL Edge | `.sqlserver/` | `sqlservr` crash-loop; database files corrupt |

> **Rule:** Data dir to wipe is always host-side path from `volumes:` bind mount in `docker-compose.yml` (`./.{name}:` pattern). For unlisted emulators, check service's volume mount.

### Response Protocol

1. **Check container logs** — Run `docker compose logs <service>` to confirm root cause.
2. **Explain clearly** — Tell user:
   - What went wrong (e.g., "The `.postgres/` data directory has leftover files from a previous run that Postgres can't use.")
   - What will happen if nothing changes (e.g., "Postgres will keep crash-looping and the `db-migrate` service will never run.")
   - What the fix involves (e.g., "Removing `.postgres/` lets Postgres reinitialize from scratch. Migrations re-run automatically, but any manually inserted test data will be lost.")
3. **Present options** — Use `ask_user` with `emulators:clean` as first choice.
4. **NEVER act without approval** — Data dir may contain state user wants to preserve.
5. **After wiping** — Run `docker compose up -d` and verify container healthy before proceeding.

---

## Rule 4: Validate Before Generating

Before generating any artifact, verify:

1. The project type was correctly detected
2. The plan was approved by the user
3. No existing file will be silently overwritten
