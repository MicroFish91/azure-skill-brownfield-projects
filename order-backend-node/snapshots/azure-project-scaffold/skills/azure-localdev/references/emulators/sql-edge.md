# SQL Edge (Azure SQL Edge)

## Docker Image

```
mcr.microsoft.com/azure-sql-edge:latest
```

## docker-compose Service Block

> **Note:** SQL Edge is **backing store** for Service Bus and Event Hubs emulators.
> Rarely used directly by app code. Add only when those emulators required.
> When both needed, use **single** `sqlserver` service block.

```yaml
services:
  sqlserver:
    image: mcr.microsoft.com/azure-sql-edge:latest
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=YourStrong@Passw0rd
    ports:
      - "1433:1433"
    volumes:
      - ./.sqlserver:/var/opt/mssql/data
    healthcheck:
      test: ["CMD", "/opt/mssql-tools/bin/sqlcmd", "-S", "localhost", "-U", "sa", "-P", "YourStrong@Passw0rd", "-Q", "SELECT 1"]
      interval: 10s
      retries: 10
      start_period: 30s
    restart: unless-stopped
```

## Connection String

```
Server=localhost,1433;Database=master;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `SqlConnectionString` (if app uses SQL directly) | `Server=localhost,1433;Database={db};User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;` |

## Notes

- Port 1433: standard SQL Server TDS protocol
- Service name is `sqlserver` (not `sql-edge`) to match `SQL_SERVER` env var expected by Service Bus and Event Hubs emulators.
- `TrustServerCertificate=True` required for emulator's self-signed cert.
- **arm64 (Apple Silicon):** Azure SQL Edge supports arm64 natively.
- **Consolidation:** NEVER add more than one `sqlserver` block. All emulators depending on SQL Edge MUST reference same service.
