# Database Migrations

Detect, configure, and auto-run database migrations as part of local dev environment. Migrations run automatically when emulators start via `docker compose up -d`.

---

## ⛔ Migrations Are Part of Emulator Startup

Database migrations are **not** separate manual step. When detected, incorporated into `docker-compose.yml` as one-shot service that:

1. Waits for database to be healthy
2. Runs all pending migrations
3. Exits

This means `docker compose up -d` (or pressing F5) automatically sets up database schema.

---

## Detection

Detection is **evidence-based, not opinionated**. Scan three layers of workspace — files, dependencies, and scripts — then synthesize to determine migration system in use. Do not assume particular tool; let evidence decide.

### Layer 1: Migration Files

Look for files and directories containing migration definitions. Common signals across ecosystems:

| Signal | Likely Indicates |
|--------|-----------------|
| `migrations/*.sql` | Raw SQL migrations |
| `prisma/schema.prisma`, `prisma/migrations/` | Prisma (Node.js) |
| `drizzle/`, `drizzle.config.*` | Drizzle (Node.js) |
| `knexfile.*` | Knex (Node.js) |
| `migrations/` with `.js` or `.ts` files | JS/TS migration runner (Knex, TypeORM, Sequelize, etc.) |
| `alembic/`, `alembic.ini` | Alembic (Python / SQLAlchemy) |
| `**/migrations/*.py` (Django-style) | Django migrations |
| `Migrations/` with `.cs` files, `*DbContext*` | Entity Framework Core (.NET) |
| `db/migrate/*.rb` | ActiveRecord (Ruby) |
| `sql/migrations/`, `flyway.conf` | Flyway (Java / multi-language) |
| `changelog.*` (XML/YAML/JSON/SQL) | Liquibase (Java / multi-language) |
| `*_test.go` alongside `*.sql` in `migrations/` | goose or golang-migrate (Go) |

> This table is **not exhaustive**. If you find migration-like files that don't match known pattern, examine them to determine tool. Structure of migration files (timestamps in filenames, up/down pairs, numbered sequences) often enough to identify system.

### Layer 2: Dependencies

Check project's dependency manifest for migration-related packages. Manifest location depends on ecosystem:

| Ecosystem | Dependency Manifest | Where to Check |
|-----------|-------------------|----------------|
| Node.js / TypeScript | `package.json` | `dependencies` and `devDependencies` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile`, `setup.cfg` | Package list |
| .NET / C# | `*.csproj`, `packages.config` | `<PackageReference>` entries |
| Java | `pom.xml`, `build.gradle` | Dependencies section |
| Go | `go.mod` | `require` directives |
| Ruby | `Gemfile` | Gem list |

Look for packages that are known migration tools or ORMs with built-in migration support. Examples by ecosystem:

**Node.js:** `prisma`, `@prisma/client`, `knex`, `drizzle-kit`, `drizzle-orm`, `typeorm`, `sequelize`, `sequelize-cli`, `node-pg-migrate`, `db-migrate`

**Python:** `alembic`, `sqlalchemy`, `django`, `flask-migrate`, `yoyo-migrations`

**.NET:** `Microsoft.EntityFrameworkCore`, `Microsoft.EntityFrameworkCore.Design`, `FluentMigrator`

**Java:** `org.flywaydb:flyway-core`, `org.liquibase:liquibase-core`

**Go:** `github.com/pressly/goose`, `github.com/golang-migrate/migrate`

**Ruby:** `activerecord`, `sequel`

> Also check for database client/driver packages (`pg`, `mysql2`, `tedious`, `psycopg2`, `Npgsql`, etc.) — helps confirm target database even when migration tool not explicitly present.

### Layer 3: Existing Scripts

Check project's script runner for migration-related commands. Where to look depends on ecosystem:

| Ecosystem | Script Location | How to Check |
|-----------|----------------|-------------|
| Node.js / TypeScript | `package.json` `"scripts"` | Grep for `migrate`, tool names |
| Python | `Makefile`, `pyproject.toml [tool.scripts]`, `manage.py` | Grep for `migrate`, `alembic`, `flask db` |
| .NET | `Makefile`, `.csproj` targets, shell scripts | Grep for `ef database update`, `dotnet-ef`, `FluentMigrator` |
| Java | `Makefile`, Maven/Gradle plugins, shell scripts | Grep for `flyway:migrate`, `liquibase:update` |
| Go | `Makefile`, shell scripts | Grep for `goose up`, `migrate -path` |
| Ruby | `Rakefile` | `rake db:migrate` |
| Any | `Makefile`, `scripts/`, `Taskfile.yml` | Grep for `migrate`, `schema`, `seed` |

> Look for **any** script, task, or make target that runs migrations — exact name and format varies widely. Key signal is command that applies schema changes to database.

### Synthesis

After scanning all three layers, determine:

1. **Which migration tool is in use** — Cross-reference files, dependencies, scripts. All three should agree. If they conflict (e.g., both Alembic and Django migrations), ask user which is active.
2. **Whether existing migration command exists** — If project has working migration script/command, use it directly rather than inventing new one.
3. **Whether migration command needs building** — If tool clear from deps/files but no script exists, construct appropriate command.

> **Prefer existing scripts.** If project has script that runs migrations, wrap that in docker-compose service rather than building parallel command.

### Insufficient Evidence

If database dependency detected (e.g., `pg` in deps, PostgreSQL in docker-compose) but **none of three layers reveal clear migration strategy** — no files, no tool in deps, no scripts — then:

1. **Do not guess.** Do not assume raw SQL or any tool.
2. **Ask user** using `ask_user`:
   - Explain what was found (database dep without migration strategy)
   - Ask how they manage schema changes
   - Offer to skip migration setup if handled another way
3. **Record gap** in plan so it's visible:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | ⚠️ Not detected — awaiting user input |
| Evidence | Database dependency found but no migration files, tools, or scripts detected |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Pending user response |
```

### What to Record

When migrations are detected, add to the scan results:

```markdown
### Database Migrations

| Attribute | Value |
|-----------|-------|
| Migration Tool | {tool name} |
| Evidence | {what was found: files, deps, scripts} |
| Migration Directory | {path} (if applicable) |
| Migration Command | {existing script or constructed command} |
| Target Database | {database type} (`{compose service name}` service) |
| Auto-Migrate | Yes (docker-compose service) |
```

---

## Docker Compose Patterns

### Healthcheck Requirement

When migrations present, target database service **must** have healthcheck so migration service can wait for readiness. Add healthcheck to any database service receiving migrations.

#### PostgreSQL Healthcheck

```yaml
services:
  postgres:
    image: postgres:16
    # ... existing config ...
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 30s
```

#### SQL Edge Healthcheck

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/azure-sql-edge:latest
    # ... existing config ...
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "LocalDev#123", "-Q", "SELECT 1"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### Migration Service Patterns

Choose the pattern that matches the detected migration tool. The key principle: **if an existing script or command already runs migrations, use it inside the container.**

#### Raw SQL → PostgreSQL

Use when: `migrations/*.sql` files exist and no ORM/migration tool is detected.

```yaml
services:
  db-migrate:
    image: postgres:16
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./migrations:/migrations:ro
    environment:
      PGPASSWORD: postgres
    entrypoint: >
      sh -c '
        echo "Running database migrations..."
        for f in /migrations/*.sql; do
          echo "  Applying: $$(basename $$f)"
          psql -h postgres -U postgres -d localdev -f "$$f" --set ON_ERROR_STOP=1
        done
        echo "Migrations complete."
      '
    restart: "no"
```

#### Raw SQL → SQL Edge

Use when: `migrations/*.sql` files exist targeting SQL Server/SQL Edge.

```yaml
services:
  db-migrate:
    image: mcr.microsoft.com/azure-sql-edge:latest
    depends_on:
      sqlserver:
        condition: service_healthy
    volumes:
      - ./migrations:/migrations:ro
    entrypoint: >
      sh -c '
        echo "Running database migrations..."
        for f in /migrations/*.sql; do
          echo "  Applying: $$(basename $$f)"
          /opt/mssql-tools/bin/sqlcmd -S sqlserver -U sa -P "LocalDev#123" -d localdev -i "$$f"
        done
        echo "Migrations complete."
      '
    restart: "no"
```

#### Application Migration Tool (Generic Pattern)

Use when: Migration tool detected via dependencies, config files, or existing scripts. Pattern works for **any ecosystem** — Node.js, Python, .NET, Java, Go, Ruby, etc. Migration service mounts project into container with right runtime, then runs migration command.

```yaml
services:
  db-migrate:
    image: ${RUNTIME_IMAGE}
    working_dir: /app
    depends_on:
      ${DATABASE_SERVICE}:
        condition: service_healthy
    volumes:
      - ./:/app:ro
      ${EXTRA_VOLUME_MOUNTS}
    environment:
      ${CONNECTION_ENV_VAR}: ${CONNECTION_STRING_FOR_COMPOSE_NETWORK}
    entrypoint: ${MIGRATION_COMMAND}
    restart: "no"
```

**Filling in the template — use detected evidence:**

| Placeholder | How to determine |
|-------------|-----------------|
| `RUNTIME_IMAGE` | Docker image providing language runtime and package manager. See table below. |
| `DATABASE_SERVICE` | Compose service name for target database (e.g., `postgres`, `sqlserver`) |
| `CONNECTION_ENV_VAR` | Env var migration tool expects. Check tool's config, `local.settings.json`, `.env`, or framework conventions. |
| `CONNECTION_STRING_FOR_COMPOSE_NETWORK` | Same shape as local connection string but with compose service name as host instead of `localhost` (e.g., `postgresql://postgres:postgres@postgres:5432/localdev`) |
| `EXTRA_VOLUME_MOUNTS` | Additional mounts needed per ecosystem (e.g., `node_modules`, `.venv`). See table below. |
| `MIGRATION_COMMAND` | Command to run migrations. Prefer existing project script if one exists. Otherwise construct from tool's CLI. |

**Runtime images by ecosystem:**

| Ecosystem | Image | Extra Volume Mounts | Notes |
|-----------|-------|-------------------|-------|
| Node.js / TypeScript | `node:{major}-slim` | `./node_modules:/app/node_modules:ro` | Mount node_modules separately for native modules |
| Python | `python:{major}.{minor}-slim` | `(.venv if used)` | May need `pip install` in entrypoint if no venv is mounted |
| .NET | `mcr.microsoft.com/dotnet/sdk:{major}.0` | — | SDK image includes `dotnet ef` tool |
| Java (Maven) | `maven:{version}-eclipse-temurin-{jdk}` | `~/.m2:/root/.m2:ro` (optional) | Or use a pre-built JAR |
| Go | `golang:{version}` | — | Or build a binary and use a minimal image |
| Ruby | `ruby:{version}-slim` | `./vendor/bundle:/app/vendor/bundle:ro` (if vendored) | |

**Migration commands — common examples by ecosystem:**

| Ecosystem | Tool | Typical Command |
|-----------|------|----------------|
| Node.js | Prisma | `npx prisma migrate deploy` (or `npx prisma db push`) |
| Node.js | Knex | `npx knex migrate:latest` |
| Node.js | Drizzle | `npx drizzle-kit push` (or `npx drizzle-kit migrate`) |
| Node.js | TypeORM | `npx typeorm migration:run -d {datasource}` |
| Node.js | Sequelize | `npx sequelize-cli db:migrate` |
| Python | Alembic | `alembic upgrade head` |
| Python | Django | `python manage.py migrate` |
| Python | Flask-Migrate | `flask db upgrade` |
| .NET | EF Core | `dotnet ef database update` |
| .NET | FluentMigrator | `dotnet fm migrate -p {provider} -c "{connstring}"` |
| Java | Flyway | `mvn flyway:migrate` or `flyway -url={url} migrate` |
| Java | Liquibase | `mvn liquibase:update` or `liquibase update` |
| Go | goose | `goose -dir migrations postgres "{connstring}" up` |
| Go | golang-migrate | `migrate -path migrations -database "{connstring}" up` |
| Ruby | ActiveRecord | `rake db:migrate` |
| **Any** | **Existing script** | **Use the project's own script** — this is always preferred |

> **Prefer the existing script.** If project has migration command in script runner (e.g., `npm run db:migrate`, `make db-migrate`, `rake db:migrate`), use as entrypoint. Respects project-specific flags, env setup, or wrappers.

> **If tool is unfamiliar**, read docs to determine correct "apply all pending migrations" command. Most tools have single CLI command. Docker-compose invariants (healthcheck dep, one-shot, read-only mount) apply regardless of tool.

**Example — Node.js / Prisma with existing script:**

```yaml
services:
  db-migrate:
    image: node:20-slim
    working_dir: /app
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./:/app:ro
      - ./node_modules:/app/node_modules:ro
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/localdev
    entrypoint: ["npm", "run", "db:migrate"]
    restart: "no"
```

**Example — Python / Alembic (constructed command):**

```yaml
services:
  db-migrate:
    image: python:3.12-slim
    working_dir: /app
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./:/app:ro
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/localdev
    entrypoint: >
      sh -c 'pip install -r requirements.txt --quiet && alembic upgrade head'
    restart: "no"
```

**Example — .NET / EF Core (constructed command):**

```yaml
services:
  db-migrate:
    image: mcr.microsoft.com/dotnet/sdk:8.0
    working_dir: /app
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./:/app:ro
    environment:
      ConnectionStrings__DefaultConnection: Host=postgres;Database=localdev;Username=postgres;Password=postgres
    entrypoint: ["dotnet", "ef", "database", "update"]
    restart: "no"
```

> **Key properties (all patterns):**
> - `depends_on` with `condition: service_healthy` — waits for database to accept connections
> - `volumes` with `:ro` — mounts project files read-only for safety
> - `restart: "no"` — runs once per `docker compose up`, does not restart after exit
> - For raw SQL: `--set ON_ERROR_STOP=1` (psql) — fails fast on SQL errors
> - Migration SQL should be **idempotent** (`CREATE TABLE IF NOT EXISTS`, etc.) — service runs on every `docker compose up -d`
> - Mount ecosystem-specific dep dirs (e.g., `node_modules`, `.venv`) when migration tool installed as project dep

---

## Convenience Scripts

Provide way for developers to run migrations outside docker-compose (e.g., debugging migration issues or targeting different database).

### When a Migration Script Already Exists

If project already has migration command in script runner (e.g., `npm run db:migrate`, `make db-migrate`, `rake db:migrate`, script in `pyproject.toml`, etc.), **do not create duplicate**. Existing script is the convenience script. Just ensure docker-compose `db-migrate` service uses it.

### When No Script Exists

Add migration convenience script using project's **native script runner**:

| Ecosystem | Where to Add | Convention |
|-----------|-------------|------------|
| Node.js / TypeScript | `package.json` `"scripts"` | `"db:migrate": "{command}"` → `npm run db:migrate` |
| Python | `Makefile` or `pyproject.toml` | `db-migrate:` target → `make db-migrate` |
| .NET | `Makefile` | `db-migrate:` target → `make db-migrate` |
| Java | `Makefile` or Maven/Gradle task | `db-migrate:` target → `make db-migrate` |
| Go | `Makefile` | `db-migrate:` target → `make db-migrate` |
| Ruby | `Rakefile` (usually built-in) | `rake db:migrate` |

Script content should be same migration command used in docker-compose service, adapted for running against `localhost` instead of compose network hostname.

**For application migration tools** (Prisma, Alembic, EF Core, Flyway, etc.), convenience script simply invokes tool's CLI — no shell script wrapper needed.

**For raw SQL migrations**, generate shell script since no tool CLI exists:

### scripts/db-migrate.sh (Raw SQL Only)

Generate this script **only** for raw SQL migrations where no migration tool CLI exists.

#### PostgreSQL variant

```sh
#!/bin/bash
# Run database migrations against the local development database.
# Usage: ./scripts/db-migrate.sh
#
# Prerequisites: Database container must be running (docker compose up -d)

set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-localdev}"

echo "Running migrations from: ${MIGRATIONS_DIR}"
echo "Target: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

for f in "${MIGRATIONS_DIR}"/*.sql; do
  echo "  Applying: $(basename "$f")"
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "$f" --set ON_ERROR_STOP=1
done

echo "Migrations complete."
```

#### SQL Edge variant

```sh
#!/bin/bash
set -euo pipefail

MIGRATIONS_DIR="$(cd "$(dirname "$0")/../migrations" && pwd)"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-1433}"
DB_USER="${DB_USER:-sa}"
DB_PASSWORD="${DB_PASSWORD:-LocalDev#123}"
DB_NAME="${DB_NAME:-localdev}"

echo "Running migrations from: ${MIGRATIONS_DIR}"
echo "Target: ${DB_HOST}:${DB_PORT}/${DB_NAME}"

for f in "${MIGRATIONS_DIR}"/*.sql; do
  echo "  Applying: $(basename "$f")"
  sqlcmd -S "${DB_HOST},${DB_PORT}" -U "${DB_USER}" -P "${DB_PASSWORD}" -d "${DB_NAME}" -i "$f"
done

echo "Migrations complete."
```

---

## Integration with Task Chain

Migrations handled **entirely by docker-compose**. No changes to VS Code task chain needed:

```
F5 → "func: host start"
       ├── dependsOn: "npm watch (functions)"
       │                └── ... build chain ...
       └── dependsOn: "Start Emulators"  ← docker compose up -d handles migration ordering
```

When `docker compose up -d` runs:

1. Database service starts and becomes healthy (healthcheck passes)
2. Migration service starts, runs all migrations, exits
3. App can now connect to fully-migrated database

> Same `Start Emulators` task — no additional VS Code task needed because docker-compose handles dependency ordering internally.

---

## Architecture Diagram

When migrations present, include migration service in Mermaid diagram:

~~~markdown
```mermaid
graph LR
    FuncHost["Azure Functions Host<br/>:7071"]
    Postgres["PostgreSQL<br/>:5432"]
    DbMigrate["db-migrate<br/>(one-shot)"]

    FuncHost -- "pg client" --> Postgres
    DbMigrate -- "runs migrations" --> Postgres
```
~~~

---

## Extensibility

Detection-based approach means new migration tools supported automatically as long as:

1. Tool is discoverable via deps, config files, or existing scripts
2. Tool has CLI command that can run inside Docker container

To improve detection for specific tool:

1. **Add rows** to detection tables in [Layer 1](#layer-1-migration-files), [Layer 2](#layer-2-dependencies), and [Layer 3](#layer-3-existing-scripts)
2. **Add an entry** to the [Migration commands by tool](#migration-commands-by-tool) table
3. **Add an entry** to the [convenience scripts table](#when-no-script-exists) if the tool has a standard CLI invocation

The key invariants for any migration tool:

- Migration service uses `depends_on` with `condition: service_healthy`
- Migration service uses `restart: "no"`
- Migrations must be idempotent (safe to re-run)
- Migrations run automatically on every `docker compose up -d`
- **Prefer existing project scripts** over constructing new commands
