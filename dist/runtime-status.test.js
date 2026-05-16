import test from 'node:test';
import assert from 'node:assert/strict';
import { AgentSwarm } from './index.js';
test('swarm exposes runtime status rows', () => {
    const Runtime = AgentSwarm;
    Runtime.applyRuntimeStatus({ processId: 'swarm-1', runId: 'run-1', status: 'running' });
    assert.equal(Runtime.runtimeStatus('run-1')[0].status, 'running');
});
