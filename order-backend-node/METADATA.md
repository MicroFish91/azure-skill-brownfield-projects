# order-backend-node — Generation Metadata

**Created**: 2026-04-27
**Repository**: [MicroFish91/azure-skill-brownfield-projects](https://github.com/MicroFish91/azure-skill-brownfield-projects)
**Branch**: `nat/newProject`

---

## Skills Used

| Skill | Version | Source |
|-------|---------|--------|
| `azure-project-plan` | `0.0.0-placeholder` | [skills/azure-project-plan/SKILL.md](../skills/azure-project-plan/SKILL.md) |
| `azure-project-scaffold` | `3.0.0` | [skills/azure-project-scaffold/SKILL.md](../skills/azure-project-scaffold/SKILL.md) |
| `azure-project-verify` | `1.0.0` | [skills/azure-project-verify/SKILL.md](../skills/azure-project-verify/SKILL.md) |

---

## Original Prompt

> /azure-project-plan
> Build an "order processing" backend in TypeScript on Azure Functions. An HTTP endpoint accepts new orders, drops them onto an Azure Service Bus queue, and a queue-triggered function validates the order and writes it to Cosmos DB (NoSQL). Include a second HTTP endpoint to fetch order status by ID. Use jest with full unit + integration coverage and mock all Azure clients.

---

## Snapshots

Each phase of the workflow produces a snapshot under [snapshots/](snapshots/):

| Phase | Snapshot | Skill |
|-------|----------|-------|
| 1. Plan | [snapshots/azure-project-plan/](snapshots/azure-project-plan/) | `azure-project-plan` |
| 2. Scaffold | [snapshots/azure-project-scaffold/](snapshots/azure-project-scaffold/) | `azure-project-scaffold` |
| 3. Verify | [snapshots/azure-project-verify/](snapshots/azure-project-verify/) | `azure-project-verify` |
| 4. Local Dev | [snapshots/azure-local-development/](snapshots/azure-local-development/) | `azure-local-development` |
