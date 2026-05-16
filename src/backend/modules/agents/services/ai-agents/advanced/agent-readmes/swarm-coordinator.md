# Swarm Coordinator AI Agent

The Swarm Coordinator decomposes complex tasks into 10-100 bounded workers and collects evidence from each worker.

## Observable decision chain

```mermaid
graph TD
  A[Complex request] --> B[Build task graph]
  B --> C[Select specialist roles]
  C --> D[Clamp worker count 10-100]
  D --> E[Assign every worker at least one task]
  E --> F[Register parent SWARM process]
  F --> G[Register SWARM_WORKER processes]
  G --> H[Emit queued/running/completed events]
  H --> I[Verifier reconciles worker outputs]
  I --> J[Cleanup publishes final artifacts]
```

## Worker rules

- No idle worker records.
- Sharded roles inherit tasks from their canonical role.
- Planner, verifier, publisher, and cleanup always exist.
- Workflow-building swarms must include workflow, node, security, data, QA, and process-monitor specialists.
- Every worker records expected output, acceptance criteria, dependency ids, and evidence summary.
