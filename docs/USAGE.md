# Usage for @connectingmatrix/agent-swarm

```ts
import { AgentSwarm } from '@connectingmatrix/agent-swarm';
AgentSwarm.bindAgents(AIAgents);
await AgentSwarm.run([{ agentId, input: 'research X' }], undefined, 10);
```

See `../README.md` for the full contract list.

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
