import { LocalEventBus, makeId, nowIso } from './contracts.js';
const bus = new LocalEventBus();
export const AgentSwarm = {
    onProgress(handler) { return bus.on('swarm:progress', handler); },
    async run(inputs, runner, concurrency = 10) {
        const run = { id: makeId('swarm'), createdAt: nowIso(), tasks: inputs.slice(0, 100).map((input) => ({ id: makeId('swarm_task'), agentId: input.agentId, input: input.input, status: 'queued' })) };
        let cursor = 0;
        async function worker() {
            while (cursor < run.tasks.length) {
                const task = run.tasks[cursor++];
                task.status = 'running';
                await bus.emit('swarm:progress', task);
                try {
                    task.output = await runner(task);
                    task.status = 'done';
                }
                catch (error) {
                    task.status = 'error';
                    task.error = error instanceof Error ? error.message : String(error);
                }
                await bus.emit('swarm:progress', task);
            }
        }
        await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, run.tasks.length)) }, worker));
        run.completedAt = nowIso();
        return run;
    },
    health() { return { name: '@connectingmatrix/agent-swarm', status: 'ok', checkedAt: nowIso() }; },
};
export const graphql = { namespace: 'agentSwarm', typeDefs: 'type Query { agentSwarmHealth: String! }', resolvers: { Query: { agentSwarmHealth: () => AgentSwarm.health().status } }, migrations: ['migrations/0001_init.sql'] };
export function createPackage() { return { name: '@connectingmatrix/agent-swarm', version: '0.1.0', health: () => AgentSwarm.health(), graphql, migrations: graphql.migrations }; }
export * from './contracts.js';
