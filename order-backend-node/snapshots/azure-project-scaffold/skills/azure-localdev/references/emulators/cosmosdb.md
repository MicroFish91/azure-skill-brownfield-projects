# Cosmos DB Emulator

## Docker Image

```
mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
```

## docker-compose Service Block

```yaml
services:
  cosmosdb:
    image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest
    environment:
      - AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10
      - AZURE_COSMOS_EMULATOR_ENABLE_DATA_PERSISTENCE=false
    ports:
      - "8081:8081"
      - "10251:10251"
      - "10252:10252"
      - "10253:10253"
      - "10254:10254"
    restart: unless-stopped
```

## Connection String

```
AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

## Required App Environment Variables

| Variable | Value |
|----------|-------|
| `CosmosDbConnection` (Functions) | `AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==` |
| `COSMOS_CONNECTION_STRING` (SDK) | same as above |

## Notes

- Port 8081: Data Explorer + REST API
- Ports 10251–10254: Direct mode TCP channels
- Emulator uses self-signed TLS cert; SDK must disable TLS verification for local dev (`AZURE_COSMOS_DISABLE_NONSTREAMING_QUERY_PLAN` may also be needed).
- **arm64 (Apple Silicon / ARM Linux):** Linux Cosmos emulator does not support arm64. Use [Try Cosmos DB](https://cosmos.azure.com/try) free-tier endpoint or run Windows emulator in VM.
- Data persistence disabled by default (`ENABLE_DATA_PERSISTENCE=false`) for fast startup; set to `true` and add volume mount if data must survive restarts.
