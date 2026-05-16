# Auto-generated API

```json
{
  "package": "@connectingmatrix/agent-swarm",
  "summary": "Thin swarm manager that runs 10-100 core agents with bounded concurrency and progress events.",
  "contracts": [
    "AgentSwarm.bindAgents(AIAgents)",
    "AgentSwarm.run(inputs, runner?, concurrency?, context?)",
    "AgentSwarm.onProgress(handler)",
    "max 100 tasks per run",
    "createPackage() launcher/status"
  ],
  "exports": [
    ".",
    "./backend",
    "./ui",
    "./entity",
    "./package.json",
    "./package-structure",
    "./launcher",
    "./observability"
  ],
  "folderCounts": {
    "src/client": 3,
    "src/backend": 10,
    "src/entity": 6,
    "migrations": 3
  },
  "launcher": "playground.mjs",
  "observability": true
}
```

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
