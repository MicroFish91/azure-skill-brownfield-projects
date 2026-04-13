# Service Bus Emulator

## Docker Image

```
mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
```

## docker-compose Service Block

> **Requires:** SQL Edge as backing store.
> Include [`sql-edge`](sql-edge.md) service in same compose file.

```yaml
services:
  servicebus:
    image: mcr.microsoft.com/azure-messaging/servicebus-emulator:latest
    environment:
      - ACCEPT_EULA=Y
      - SQL_SERVER=sqlserver
      - MSSQL_SA_PASSWORD=YourStrong@Passw0rd
    ports:
      - "5672:5672"
    depends_on:
      sqlserver:
        condition: service_healthy
    restart: unless-stopped

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

> **Consolidation:** If Event Hubs Emulator also needed, shares same `sqlserver` service.
> Do not add second `sqlserver` block — merge both under one `sqlserver`.

## Connection String

```
Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `ServiceBusConnection` (Functions) | `Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;` |
| `AZURE_SERVICEBUS_CONNECTION_STRING` (SDK) | same as above |

## Notes

- Port 5672: AMQP protocol
- SQL Edge default port 1433 mapped to host; adjust if another SQL Server running locally.
- SA password MUST match between `servicebus` → `MSSQL_SA_PASSWORD` and `sqlserver` → `MSSQL_SA_PASSWORD`.
