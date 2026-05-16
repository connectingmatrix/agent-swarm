import { type PackageLauncherPanel, type RequestContext } from './contracts.js';
export declare function createConnectingmatrixAgentSwarmStubLauncher(context?: RequestContext): PackageLauncherPanel;
export declare const createStubLauncher: typeof createConnectingmatrixAgentSwarmStubLauncher;
export declare const Launcher: {
    open: typeof createConnectingmatrixAgentSwarmStubLauncher;
    mode: "stub";
};
export declare const launcher: typeof createConnectingmatrixAgentSwarmStubLauncher;
