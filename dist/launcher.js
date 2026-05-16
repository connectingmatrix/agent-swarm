import { nowIso } from './contracts.js';
export function createConnectingmatrixAgentSwarmStubLauncher(context = {}) {
    return {
        packageName: '@connectingmatrix/agent-swarm',
        title: 'Agent Swarm Launcher',
        mode: 'stub',
        status: 'ready',
        checkedAt: nowIso(),
        summary: 'Launches a 10-100 agent coordinator with progress events, bounded concurrency and swarm run entities.',
        healthPath: '/agent-swarm/health',
        graphqlNamespace: 'agentSwarm',
        routes: [
            { method: 'GET', path: '/agent-swarm/health', description: 'Health/status endpoint' },
            { method: 'GET', path: '/agentSwarm/launcher', description: 'Stub launcher panel' }
        ],
        owns: {
            ui: ['dataloaders', 'bindWithServer', 'status/launcher UI'],
            backend: ["swarm task scheduler", "progress bus"],
            entity: ["SwarmRun", "SwarmTask"],
            migrations: ['migrations/*.sql']
        },
        actions: [
            { name: 'run10', label: 'run10', method: 'LOCAL', description: 'Run run10 demo action' },
            { name: 'run100', label: 'run100', method: 'LOCAL', description: 'Run run100 demo action' },
            { name: 'onProgress', label: 'onProgress', method: 'LOCAL', description: 'Run onProgress demo action' }
        ],
        sampleData: { context: 'stub-playground', userId: context.userId ?? 'stub-user' },
        context: { userId: context.userId, organizationId: context.organizationId, root: Boolean(context.root), traceId: context.traceId },
        notes: [
            'This launcher is intentionally stub-mode playable so the package can be tested outside giga-ai-backend.',
            'The launcher exposes this package boundary only; cross-package behavior is injected through adapters.'
        ]
    };
}
export const createStubLauncher = createConnectingmatrixAgentSwarmStubLauncher;
export const Launcher = { open: createConnectingmatrixAgentSwarmStubLauncher, mode: 'stub' };
export const launcher = createConnectingmatrixAgentSwarmStubLauncher;
