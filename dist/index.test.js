import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentSwarm } from './index.js';
test('runs swarm', async () => { const r = await AgentSwarm.run([{ agentId: 'a', input: 'x' }], async (t) => t.input); assert.equal(r.tasks[0].status, 'done'); });
