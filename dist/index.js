import { LocalEventBus, makeId, nowIso } from './contracts.js';
import { createPackageStatusPanel } from './services/package-status.service.js';
import { PackageObservability } from './observability.js';
const bus = new LocalEventBus();
let systems = {};
let processMonitoring;
function resolveSystem(task) { return task.system ? systems[task.system] : systems.aiAgents; }
function processIdOf(row, fallback) { return row?.id ?? row?.processId ?? fallback; }
export const AgentSwarm = {
    bindAgents(api) { systems.aiAgents = api; return AgentSwarm; },
    bindSystems(next) { systems = { ...systems, ...next }; return AgentSwarm; },
    bindProcessMonitor(monitor) { processMonitoring = monitor; return AgentSwarm; },
    bindProcessMonitoring(monitor) { processMonitoring = monitor; return AgentSwarm; },
    systems() { return Object.keys(systems).filter((key) => Boolean(systems[key])); },
    onProgress(handler) { return bus.on('swarm:progress', handler); },
    async run(inputs, runner, concurrency = 10, context = {}) {
        const fallbackPid = `swarm:${makeId('swarm')}`;
        const proc = processMonitoring?.start?.({ kind: 'Swarm', packageName: '@connectingmatrix/agent-swarm', title: 'Agent Swarm', targetId: fallbackPid, context, metadata: { taskCount: inputs.length } });
        const processId = processIdOf(proc, fallbackPid);
        const run = { id: makeId('swarm'), createdAt: nowIso(), processId, tasks: inputs.slice(0, 100).map((input) => ({ id: makeId('swarm_task'), agentId: input.agentId, input: input.input, system: input.system, status: 'queued', processId })) };
        PackageObservability.track(processId, { label: 'Agent Swarm', status: 'running', progress: 5, context: { processKind: 'Swarm', taskCount: run.tasks.length } }, context);
        processMonitoring?.appendLog?.(processId, 'info', 'Swarm run started', { taskCount: run.tasks.length });
        const execute = runner ?? (async (task) => {
            const system = resolveSystem(task);
            if (!system)
                throw new Error('AgentSwarm requires bindSystems({ aiAgents, advancedAgents, gigaAgents }) or a runner callback');
            if (task.system === 'advancedAgents' && system.runAgent) {
                const result = await system.runAgent(task.agentId, { message: task.input }, context);
                return result.output ?? JSON.stringify(result);
            }
            if (task.system === 'gigaAgents' && system.runWorkflowAgent) {
                const result = await system.runWorkflowAgent({ prompt: task.input }, context);
                return result.output ?? JSON.stringify(result.artifact ?? result);
            }
            if (!system.run)
                throw new Error(`Selected swarm system does not expose run(): ${task.system ?? 'aiAgents'}`);
            const result = await system.run({ agentId: task.agentId, message: task.input }, context);
            return result.output ?? JSON.stringify(result);
        });
        const executeTask = async (task) => {
            task.status = 'running';
            processMonitoring?.heartbeat?.(processId, { status: 'ok', message: `Running ${task.agentId}`, metadata: { taskId: task.id, system: task.system ?? 'aiAgents' } });
            PackageObservability.track(`${processId}:${task.id}`, { label: `Swarm task ${task.agentId}`, status: 'running', progress: 40, context: { processKind: 'Swarm', system: task.system ?? 'aiAgents', runId: run.id, taskId: task.id } }, context);
            await bus.emit('swarm:progress', task);
            try {
                task.output = await execute(task);
                task.status = 'done';
                processMonitoring?.appendLog?.(processId, 'info', `Swarm task completed: ${task.agentId}`, { taskId: task.id });
                PackageObservability.track(`${processId}:${task.id}`, { label: `Swarm task ${task.agentId}`, status: 'completed', progress: 100, context: { processKind: 'Swarm', system: task.system ?? 'aiAgents', runId: run.id, taskId: task.id } }, context);
            }
            catch (error) {
                task.status = 'error';
                task.error = error instanceof Error ? error.message : String(error);
                processMonitoring?.appendLog?.(processId, 'error', task.error, { taskId: task.id });
                PackageObservability.track(`${processId}:${task.id}`, { label: `Swarm task ${task.agentId}`, status: 'failed', progress: 100, context: { processKind: 'Swarm', system: task.system ?? 'aiAgents', runId: run.id, taskId: task.id } }, context);
            }
            await bus.emit('swarm:progress', task);
        };
        const safeConcurrency = Math.max(1, Math.min(concurrency, run.tasks.length || 1, 100));
        for (let offset = 0; offset < run.tasks.length; offset += safeConcurrency) {
            await Promise.all(run.tasks.slice(offset, offset + safeConcurrency).map((task) => executeTask(task)));
        }
        run.completedAt = nowIso();
        const failed = run.tasks.filter((task) => task.status === 'error').length;
        if (failed)
            processMonitoring?.fail?.(processId, `${failed} swarm tasks failed`, { runId: run.id, failed });
        else
            processMonitoring?.complete?.(processId, { runId: run.id, taskCount: run.tasks.length });
        PackageObservability.track(processId, { label: 'Agent Swarm', status: failed ? 'failed' : 'completed', progress: 100, context: { processKind: 'Swarm', taskCount: run.tasks.length, failed } }, context);
        return run;
    },
    abortTask(runId, taskId, context = {}) { PackageObservability.track(`swarm:${runId}:${taskId}`, { label: `Swarm task ${taskId}`, status: 'aborted', progress: 100, context: { processKind: 'Swarm', runId, taskId } }, context); return { runId, taskId, status: 'aborted', abortedAt: nowIso() }; },
    abort(processId, reason = 'aborted by user') { return processMonitoring?.abort?.(processId, reason) ?? { processId, aborted: true, reason }; },
    health() { return { name: '@connectingmatrix/agent-swarm', status: systems.aiAgents || systems.advancedAgents || systems.gigaAgents ? 'ok' : 'degraded', checkedAt: nowIso(), details: { systems: AgentSwarm.systems(), agentSystemBound: Boolean(systems.aiAgents), advancedAgentsBound: Boolean(systems.advancedAgents), gigaAgentsBound: Boolean(systems.gigaAgents), processMonitoring: Boolean(processMonitoring), maxAgents: 100, ...PackageObservability.healthDetails() } }; },
};
export const graphql = { namespace: 'agentSwarm', typeDefs: 'type Query { agentSwarmHealth: String!, agentSwarmLauncher: String! } type Mutation { agentSwarmRun(message: String!): String! }', resolvers: { Query: { agentSwarmHealth: () => AgentSwarm.health().status, agentSwarmLauncher: (_, __, ctx) => JSON.stringify(createPackageStatusPanel(ctx)) }, Mutation: { agentSwarmRun: async (_, args, ctx) => JSON.stringify(await AgentSwarm.run([{ agentId: 'default', input: args.message }], undefined, 10, ctx)) } }, migrations: ['migrations/0001_init.sql'] };
export function createPackage() { return { name: '@connectingmatrix/agent-swarm', version: '0.5.0', health: () => AgentSwarm.health(), graphql, migrations: graphql.migrations, launcher: createPackageStatusPanel, runtime: { AgentSwarm, observability: PackageObservability }, routes: [{ method: 'GET', path: '/agent-swarm/health', handler: () => AgentSwarm.health() }, { method: 'GET', path: '/agent-swarm/launcher', handler: (request) => createPackageStatusPanel(request.context ?? {}) }] }; }
export * from './contracts.js';
export * from './package-structure.js';
export * from './observability.js';
export * from './services/package-status.service.js';
