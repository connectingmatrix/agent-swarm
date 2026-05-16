import { type PackageHealth, type PackageModule, type RequestContext } from './contracts.js';
export interface SwarmTask {
    id: string;
    agentId: string;
    input: string;
    system?: keyof SwarmSystems;
    status: 'queued' | 'running' | 'done' | 'error' | 'aborted';
    output?: string;
    error?: string;
    processId?: string;
}
export interface SwarmRun {
    id: string;
    tasks: SwarmTask[];
    createdAt: string;
    completedAt?: string;
    processId: string;
}
export interface AgentSystemLike {
    run?: (input: {
        agentId?: string;
        message: string;
        context?: Record<string, unknown>;
    }, context?: RequestContext) => Promise<{
        output?: string;
    }> | {
        output?: string;
    };
    runAgent?: (kind: string, input: {
        message: string;
        objective?: string;
        agentId?: string;
    }, context?: RequestContext) => Promise<{
        output?: string;
    }> | {
        output?: string;
    };
    runWorkflowAgent?: (input: {
        prompt: string;
    }, context?: RequestContext) => Promise<{
        output?: string;
        artifact?: unknown;
    }> | {
        output?: string;
        artifact?: unknown;
    };
    getObject?: (id: string, context?: RequestContext) => unknown;
}
export interface SwarmSystems {
    aiAgents?: AgentSystemLike;
    advancedAgents?: AgentSystemLike;
    gigaAgents?: AgentSystemLike;
}
export interface ProcessMonitoringLike {
    start?: (input: {
        kind: string;
        packageName: string;
        title: string;
        targetId?: string;
        context?: RequestContext;
        metadata?: Record<string, unknown>;
    }) => {
        id?: string;
        processId?: string;
    };
    register?: (input: {
        processId: string;
        kind?: string;
        packageName?: string;
        name?: string;
        metadata?: Record<string, unknown>;
    }, context?: RequestContext) => unknown;
    heartbeat?: (processId: string, input?: {
        status?: string;
        message?: string;
        metadata?: Record<string, unknown>;
    }) => unknown;
    appendLog?: (processId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown) => unknown;
    complete?: (processId: string, metadata?: Record<string, unknown>) => unknown;
    fail?: (processId: string, error: unknown, metadata?: Record<string, unknown>) => unknown;
    abort?: (processId: string, reason?: string) => unknown;
}
export declare const AgentSwarm: {
    bindAgents(api: AgentSystemLike): /*elided*/ any;
    bindSystems(next: SwarmSystems): /*elided*/ any;
    bindProcessMonitor(monitor: ProcessMonitoringLike): /*elided*/ any;
    bindProcessMonitoring(monitor: ProcessMonitoringLike): /*elided*/ any;
    systems(): string[];
    onProgress(handler: (task: SwarmTask) => void | Promise<void>): () => void;
    run(inputs: Array<{
        agentId: string;
        input: string;
        system?: keyof SwarmSystems;
    }>, runner?: (task: SwarmTask) => Promise<string>, concurrency?: number, context?: RequestContext): Promise<SwarmRun>;
    abortTask(runId: string, taskId: string, context?: RequestContext): {
        runId: string;
        taskId: string;
        status: "aborted";
        abortedAt: string;
    };
    abort(processId: string, reason?: string): unknown;
    health(): PackageHealth;
};
export declare const graphql: {
    namespace: string;
    typeDefs: string;
    resolvers: {
        Query: {
            agentSwarmHealth: () => "ok" | "degraded" | "down";
            agentSwarmLauncher: (_: unknown, __: unknown, ctx: RequestContext) => string;
        };
        Mutation: {
            agentSwarmRun: (_: unknown, args: {
                message: string;
            }, ctx: RequestContext) => Promise<string>;
        };
    };
    migrations: string[];
};
export declare function createPackage(): PackageModule;
export * from './contracts.js';
export * from './package-structure.js';
export * from './observability.js';
export * from './services/package-status.service.js';
