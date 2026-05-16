# @connectingmatrix/agent-swarm

Thin swarm manager that runs 10-100 core agents with bounded concurrency and progress events.

## Ownership

This package owns its `src/client`, `src/backend`, `src/entity`, GraphQL bundle, migrations, health/status, launcher, and package contracts. It can be included in backend or UI without assuming a monorepo.

## Public contracts

- `AgentSwarm.bindAgents(AIAgents)`
- `AgentSwarm.run(inputs, runner?, concurrency?, context?)`
- `AgentSwarm.onProgress(handler)`
- `max 100 tasks per run`
- `createPackage() launcher/status`


## Basic usage

```ts
import { AgentSwarm } from '@connectingmatrix/agent-swarm';
AgentSwarm.bindAgents(AIAgents);
await AgentSwarm.run([{ agentId, input: 'research X' }], undefined, 10);
```

## Server usage

```ts
import { createPackage } from '@connectingmatrix/agent-swarm';
const pkg = createPackage();
await pkg.health?.();
// register pkg.routes as middleware and merge pkg.graphql into /graphql
```

## UI usage

Package UI modules expose `bindWithServer('/graphql')` where applicable. Domain packages own their dataloaders; the thin UI only renders/binds.

## Observability and process monitor

All packages expose `PackageObservability`. The server wires logger and sockets into every package. Logger registers package health probes and exposes `/logger/process-monitor` plus `/server/process-monitor`.

## Launcher

Run locally:

```bash
npm run build
node playground.mjs
```

The launcher opens in stub mode so the package can be tested independently, similar to workflow designer stub mode.

## GraphQL and routes

GraphQL namespace and routes are returned by `createPackage()`. Routes include health and launcher endpoints when needed.

## Exports

- `.`
- `./backend`
- `./ui`
- `./entity`
- `./package.json`
- `./package-structure`
- `./launcher`
- `./observability`

## Folder counts

- `src/client`: 3 files
- `src/backend`: 10 files
- `src/entity`: 6 files
- `migrations`: 3 files



## Final gap closure

See `docs/FINAL_GAP_CLOSURE_CONTRACTS.md` for the final process-monitor, project, node, workflow, and package-owned contract audit.

## Eighth pass swarm binding contract

`@connectingmatrix/agent-swarm` manages 10-100 agent task runs and binds to the three agent systems instead of guessing ownership.

```ts
AgentSwarm.bindProcessMonitor(processMonitoring);
AgentSwarm.bindSystems({ aiAgents: AIAgents, advancedAgents: AdvancedAIAgents, gigaAgents: GigaAgents });
await AgentSwarm.run([
  { agentId: 'agent-id', input: 'core task', system: 'aiAgents' },
  { agentId: 'planner-agent', input: 'plan task', system: 'advancedAgents' },
  { agentId: 'workflow-designer-agent', input: 'build flow', system: 'gigaAgents' },
]);
AgentSwarm.abort('PROCESS_ID', 'user aborted swarm');
```

## Final runtime contracts

See `docs/FINAL_RUNTIME_CONTRACTS.md` for the final package-owned API, routes, launcher, observability, and wiring contracts.


## Final package contracts

- `AgentSwarm.bindSystems({aiAgents,advancedAgents,gigaAgents})`
- `AgentSwarm.run(tasks, runner?, concurrency?)`
- `AgentSwarm.abortTask(runId, taskId)`
- `AgentSwarm.abort(processId)`
- `AgentSwarm.systems()`

See `docs/AUTO_GENERATED_CONTRACTS.md` and `docs/OBSERVABILITY.md` for generated operational docs.
