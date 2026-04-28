# Event Hubs Emulator

## Docker Image

```
mcr.microsoft.com/azure-messaging/eventhubs-emulator:latest
```

## docker-compose Service Block

> **Requires:** Both Azurite (checkpointing) and SQL Edge (backing store).
> Include [`azurite`](azurite.md) and [`sql-edge`](sql-edge.md) services.

```yaml
services:
  eventhubs:
    image: mcr.microsoft.com/azure-messaging/eventhubs-emulator:latest
    environment:
      - ACCEPT_EULA=Y
      - SQL_SERVER=sqlserver
      - MSSQL_SA_PASSWORD=YourStrong@Passw0rd
      - BLOB_SERVER=azurite
      - METADATA_SERVER=azurite
    ports:
      - "5672:5672"
    depends_on:
      azurite:
        condition: service_started
      sqlserver:
        condition: service_healthy
    restart: unless-stopped

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    command: azurite --blobHost 0.0.0.0 --queueHost 0.0.0.0 --tableHost 0.0.0.0 --skipApiVersionCheck
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"
    volumes:
      - ./.azurite:/data
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

> **Consolidation:**
> - If Azurite already needed for storage bindings, share single `azurite` service.
> - If Service Bus Emulator also needed, share single `sqlserver` service.
> - NEVER add duplicate service blocks for same emulator.

## Connection String

```
Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `EventHubConnection` (Functions) | `Endpoint=sb://localhost;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE;UseDevelopmentEmulator=true;` |
| `AZURE_EVENTHUBS_CONNECTION_STRING` (SDK) | same as above |

## Notes

- Port 5672: AMQP (same port as Service Bus Emulator — cannot both run on host unless remapped).
- If both Service Bus and Event Hubs emulators needed, remap one to different host port (e.g., `5673:5672` for Event Hubs).
- SQL Edge + Azurite make this heaviest emulator combo; expect ~30s startup.
