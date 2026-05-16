import { LocalEventBus, makeId, nowIso, type PackageHealth, type PackageModule, type RequestContext } from './contracts.js';
import { createStubLauncher } from './launcher.js';
import { PackageObservability } from './observability.js';

export interface SwarmTask { id: string; agentId: string; input: string; system?: keyof SwarmSystems; status: 'queued' | 'running' | 'done' | 'error' | 'aborted'; output?: string; error?: string; processId?: string; }
export interface SwarmRun { id: string; tasks: SwarmTask[]; createdAt: string; completedAt?: string; processId: string; }
export interface AgentSystemLike { run?: (input: { agentId?: string; message: string; context?: Record<string, unknown> }, context?: RequestContext) => Promise<{ output?: string }> | { output?: string }; runAgent?: (kind: string, input: { message: string; objective?: string; agentId?: string }, context?: RequestContext) => Promise<{ output?: string }> | { output?: string }; runWorkflowAgent?: (input: { prompt: string }, context?: RequestContext) => Promise<{ output?: string; artifact?: unknown }> | { output?: string; artifact?: unknown }; getObject?: (id: string, context?: RequestContext) => unknown; }
export interface SwarmSystems { aiAgents?: AgentSystemLike; advancedAgents?: AgentSystemLike; gigaAgents?: AgentSystemLike; }
export interface ProcessMonitoringLike { start?: (input: { kind: string; packageName: string; title: string; targetId?: string; context?: RequestContext; metadata?: Record<string, unknown> }) => { id?: string; processId?: string }; register?: (input: { processId: string; kind?: string; packageName?: string; name?: string; metadata?: Record<string, unknown> }, context?: RequestContext) => unknown; heartbeat?: (processId: string, input?: { status?: string; message?: string; metadata?: Record<string, unknown> }) => unknown; appendLog?: (processId: string, level: 'debug'|'info'|'warn'|'error', message: string, data?: unknown) => unknown; complete?: (processId: string, metadata?: Record<string, unknown>) => unknown; fail?: (processId: string, error: unknown, metadata?: Record<string, unknown>) => unknown; abort?: (processId: string, reason?: string) => unknown; }


export interface SwarmRuntimeStatus { processId: string; runId?: string; status: 'queued'|'running'|'completed'|'failed'|'aborted'; progress: number; updatedAt: string; logs: string[]; }
const swarmRuntimeStatuses = new Map<string, SwarmRuntimeStatus>();
function applySwarmRuntimeStatus(event: Partial<SwarmRuntimeStatus> & { processId: string }): SwarmRuntimeStatus { const previous = swarmRuntimeStatuses.get(event.processId); const row: SwarmRuntimeStatus = { processId: event.processId, runId: event.runId ?? previous?.runId, status: event.status ?? previous?.status ?? 'running', progress: event.progress ?? previous?.progress ?? 50, updatedAt: nowIso(), logs: [...(previous?.logs ?? []), ...(event.logs ?? [])].slice(-500) }; swarmRuntimeStatuses.set(row.processId, row); processMonitoring?.heartbeat?.(row.processId, { status: row.status === 'failed' ? 'error' : 'ok', message: `Swarm ${row.status}`, metadata: { runId: row.runId } }); return row; }
const bus = new LocalEventBus();
let systems: SwarmSystems = {};
let processMonitoring: ProcessMonitoringLike | undefined;
function resolveSystem(task: SwarmTask): AgentSystemLike | undefined { return task.system ? systems[task.system] : systems.aiAgents; }
function processIdOf(row: { id?: string; processId?: string } | undefined, fallback: string) { return row?.id ?? row?.processId ?? fallback; }

export const AgentSwarm = {
  bindAgents(api: AgentSystemLike) { systems.aiAgents = api; return AgentSwarm; },
  bindSystems(next: SwarmSystems) { systems = { ...systems, ...next }; return AgentSwarm; },
  bindProcessMonitor(monitor: ProcessMonitoringLike) { processMonitoring = monitor; return AgentSwarm; },
  bindProcessMonitoring(monitor: ProcessMonitoringLike) { processMonitoring = monitor; return AgentSwarm; },
  systems() { return Object.keys(systems).filter((key) => Boolean((systems as Record<string, unknown>)[key])); },
  onProgress(handler: (task: SwarmTask) => void | Promise<void>) { return bus.on('swarm:progress', handler); },
  async run(inputs: Array<{ agentId: string; input: string; system?: keyof SwarmSystems }>, runner?: (task: SwarmTask) => Promise<string>, concurrency = 10, context: RequestContext = {}): Promise<SwarmRun> {
    const fallbackPid = `swarm:${makeId('swarm')}`;
    const proc = processMonitoring?.start?.({ kind: 'Swarm', packageName: '@connectingmatrix/agent-swarm', title: 'Agent Swarm', targetId: fallbackPid, context, metadata: { taskCount: inputs.length } });
    const processId = processIdOf(proc, fallbackPid);
    const run: SwarmRun = { id: makeId('swarm'), createdAt: nowIso(), processId, tasks: inputs.slice(0, 100).map((input) => ({ id: makeId('swarm_task'), agentId: input.agentId, input: input.input, system: input.system, status: 'queued', processId })) };
    PackageObservability.track(processId, { label: 'Agent Swarm', status: 'running', progress: 5, context: { processKind: 'Swarm', taskCount: run.tasks.length } }, context); processMonitoring?.appendLog?.(processId, 'info', 'Swarm run started', { taskCount: run.tasks.length });
    const execute = runner ?? (async (task: SwarmTask) => {
      const system = resolveSystem(task);
      if (!system) throw new Error('AgentSwarm requires bindSystems({ aiAgents, advancedAgents, gigaAgents }) or a runner callback');
      if (task.system === 'advancedAgents' && system.runAgent) { const result = await system.runAgent(task.agentId, { message: task.input }, context); return result.output ?? JSON.stringify(result); }
      if (task.system === 'gigaAgents' && system.runWorkflowAgent) { const result = await system.runWorkflowAgent({ prompt: task.input }, context); return result.output ?? JSON.stringify(result.artifact ?? result); }
      if (!system.run) throw new Error(`Selected swarm system does not expose run(): ${task.system ?? 'aiAgents'}`);
      const result = await system.run({ agentId: task.agentId, message: task.input }, context);
      return result.output ?? JSON.stringify(result);
    });
    const executeTask = async (task: SwarmTask) => {
      task.status = 'running';
      processMonitoring?.heartbeat?.(processId, { status: 'ok', message: `Running ${task.agentId}`, metadata: { taskId: task.id, system: task.system ?? 'aiAgents' } });
      PackageObservability.track(`${processId}:${task.id}`, { label: `Swarm task ${task.agentId}`, status: 'running', progress: 40, context: { processKind: 'Swarm', system: task.system ?? 'aiAgents', runId: run.id, taskId: task.id } }, context);
      await bus.emit('swarm:progress', task);
      try {
        task.output = await execute(task);
        task.status = 'done';
        processMonitoring?.appendLog?.(processId, 'info', `Swarm task completed: ${task.agentId}`, { taskId: task.id });
        PackageObservability.track(`${processId}:${task.id}`, { label: `Swarm task ${task.agentId}`, status: 'completed', progress: 100, context: { processKind: 'Swarm', system: task.system ?? 'aiAgents', runId: run.id, taskId: task.id } }, context);
      } catch (error) {
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
    const failed = run.tasks.filter((task)=>task.status==='error').length;
    if (failed) processMonitoring?.fail?.(processId, `${failed} swarm tasks failed`, { runId: run.id, failed }); else processMonitoring?.complete?.(processId, { runId: run.id, taskCount: run.tasks.length });
    PackageObservability.track(processId, { label: 'Agent Swarm', status: failed ? 'failed' : 'completed', progress: 100, context: { processKind: 'Swarm', taskCount: run.tasks.length, failed } }, context);
    return run;
  },
  abortTask(runId: string, taskId: string, context: RequestContext = {}) { PackageObservability.track(`swarm:${runId}:${taskId}`, { label: `Swarm task ${taskId}`, status: 'aborted', progress: 100, context: { processKind: 'Swarm', runId, taskId } }, context); return { runId, taskId, status: 'aborted' as const, abortedAt: nowIso() }; },
  abort(processId: string, reason = 'aborted by user') { return processMonitoring?.abort?.(processId, reason) ?? { processId, aborted: true, reason }; },
  health(): PackageHealth { return { name: '@connectingmatrix/agent-swarm', status: systems.aiAgents || systems.advancedAgents || systems.gigaAgents ? 'ok' : 'degraded', checkedAt: nowIso(), details: { systems: AgentSwarm.systems(), agentSystemBound: Boolean(systems.aiAgents), advancedAgentsBound: Boolean(systems.advancedAgents), gigaAgentsBound: Boolean(systems.gigaAgents), processMonitoring: Boolean(processMonitoring), runtimeStatuses: swarmRuntimeStatuses.size, maxAgents: 100, ...PackageObservability.healthDetails() } }; },
};

Object.assign(AgentSwarm, { applyRuntimeStatus: applySwarmRuntimeStatus, runtimeStatus(runId?: string) { const rows = [...swarmRuntimeStatuses.values()]; return runId ? rows.filter((row) => row.runId === runId) : rows; } });
export const graphql = { namespace: 'agentSwarm', typeDefs: 'type Query { agentSwarmHealth: String!, agentSwarmLauncher: String!, agentSwarmRuntimeStatus(runId: ID): String! } type Mutation { agentSwarmRun(message: String!): String! }', resolvers: { Query: { agentSwarmHealth: () => AgentSwarm.health().status, agentSwarmLauncher: (_: unknown, __: unknown, ctx: RequestContext) => JSON.stringify(createStubLauncher(ctx)), agentSwarmRuntimeStatus: (_: unknown,args:{runId?:string}) => JSON.stringify((AgentSwarm as unknown as { runtimeStatus: (runId?: string)=>unknown }).runtimeStatus(args.runId)) }, Mutation: { agentSwarmRun: async (_:unknown,args:{message:string},ctx:RequestContext)=>JSON.stringify(await AgentSwarm.run([{agentId:'default',input:args.message}], undefined, 10, ctx)) } }, migrations: ['migrations/0001_init.sql'] };
export function createPackage(): PackageModule { return { name: '@connectingmatrix/agent-swarm', version: '0.5.0', health: () => AgentSwarm.health(), graphql, migrations: graphql.migrations, launcher: createStubLauncher, runtime: { AgentSwarm, observability: PackageObservability }, routes: [{ method: 'GET', path: '/agent-swarm/health', handler: () => AgentSwarm.health() }, { method: 'GET', path: '/agent-swarm/launcher', handler: (request) => createStubLauncher((request as { context?: RequestContext }).context ?? {}) }] }; }
export * from './contracts.js'; export * from './package-structure.js'; export * from './observability.js'; export * from './launcher.js';
