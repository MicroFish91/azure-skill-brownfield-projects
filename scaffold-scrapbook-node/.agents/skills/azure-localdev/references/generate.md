# Artifact Generation

Generate local dev config files from approved plan.

---

## ⛔ CRITICAL: Plan Must Be Approved First

**Do NOT generate any files until `.azure/local-dev.plan.md` exists and user has approved it.** Plan is source of truth — generate exactly what it specifies.

---

## Pre-Generation Checks

Before generating any artifact, verify:

1. ✅ Plan exists at `.azure/local-dev.plan.md` with status `Approved` or `Executing`
2. ✅ Project type and runtime correctly detected (from [classify.md](classify.md))
3. ✅ Inventory results documented in plan (from [inventory.md](inventory.md))
4. ✅ No existing file will be silently overwritten (see [Global Rules](global-rules.md))

---

## Stale Data Directory Pre-Flight

Before generating files, check for leftover emulator data dirs from previous run (e.g. `.postgres/`, `.azurite/`, `.cosmos/`, `.servicebus/`). These can cause container startup failures — e.g., PostgreSQL's `initdb` refuses to initialize if `/var/lib/postgresql/data` (mounted from `.postgres/`) contains files from incompatible or partial cluster.

If stale dirs found:

1. **List all found dirs** with sizes.
2. **Ask user** via `ask_user`:

```
ask_user(
  question: "The following emulator data directories were found from a previous run:\n\n- .postgres/ (45 MB)\n- .azurite/ (12 MB)\n\nThese can cause container startup failures. How would you like to handle this?",
  choices: [
    "Delete them and start fresh (recommended)",
    "Keep them — I want to preserve the existing data"
  ]
)
```

3. **If user chooses delete** — Remove dirs (`rm -rf`) before proceeding.
4. **If user keeps them** — Proceed, but warn containers may fail to start. If they do, offer cleanup.
5. **NEVER delete data dirs silently** — Always confirm with user first.

> Especially important when workspace was freshly scaffolded from new `.azure/project-plan.md` but contains stale data from prior run.

---

## Port Conflict Pre-Flight

Before generating files, scan all ports required by planned emulators. Run `lsof -i -P -n` (macOS/Linux) filtered to ports in approved plan. For each occupied port, identify process name and PID.

If conflicts found:

1. **List all conflicts** — port, process name, PID.
2. **Ask user** via `ask_user`:

```
ask_user(
  question: "The following ports are already in use on your machine:\n\n- Port 5432 → postgres (PID 1234)\n\nThese ports are needed by the planned emulators. How would you like to handle this?",
  choices: [
    "Help me remap the conflicting ports to alternatives",
    "I'll handle it myself — proceed with the plan as-is"
  ]
)
```

3. **If user wants remapping** — Propose alternative ports, update all references (docker-compose ports, connection strings, convenience scripts, launch config), resume generation.
4. **If user handles it** — Proceed with original ports. They resolve conflicts before `docker compose up`.
5. **NEVER remap ports or modify config silently** — Always confirm with user.

### Reactive (When Containers Fail at Runtime)

If containers fail after generation — or user reports unhealthy container / docker compose errors — re-run port scan and follow same protocol.


