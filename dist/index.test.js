import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentSwarm } from './index.js';
test('runs swarm and knows ai/advanced/giga systems', async () => {
    AgentSwarm.bindSystems({
        aiAgents: { run: async (input) => ({ output: `ai:${input.message}` }) },
        advancedAgents: { runAgent: async (_kind, input) => ({ output: `advanced:${input.message}` }) },
        gigaAgents: { runWorkflowAgent: async (input) => ({ artifact: input.prompt }) },
    });
    const r = await AgentSwarm.run([{ agentId: 'a', input: 'x' }, { agentId: 'software-builder-agent', input: 'y', system: 'advancedAgents' }, { agentId: 'workflow-designer-agent', input: 'z', system: 'gigaAgents' }], undefined, 2);
    assert.equal(r.tasks.every((task) => task.status === 'done'), true);
    assert.deepEqual(AgentSwarm.systems(), ['aiAgents', 'advancedAgents', 'gigaAgents']);
});
