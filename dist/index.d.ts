import { type PackageHealth, type PackageModule } from './contracts.js';
export interface SwarmTask {
    id: string;
    agentId: string;
    input: string;
    status: 'queued' | 'running' | 'done' | 'error';
    output?: string;
    error?: string;
}
export interface SwarmRun {
    id: string;
    tasks: SwarmTask[];
    createdAt: string;
    completedAt?: string;
}
export declare const AgentSwarm: {
    onProgress(handler: (task: SwarmTask) => void | Promise<void>): () => void;
    run(inputs: Array<{
        agentId: string;
        input: string;
    }>, runner: (task: SwarmTask) => Promise<string>, concurrency?: number): Promise<SwarmRun>;
    health(): PackageHealth;
};
export declare const graphql: {
    namespace: string;
    typeDefs: string;
    resolvers: {
        Query: {
            agentSwarmHealth: () => "ok" | "degraded" | "down";
        };
    };
    migrations: string[];
};
export declare function createPackage(): PackageModule;
export * from './contracts.js';
