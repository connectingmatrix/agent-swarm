declare module '@connectingmatrix/ai-agents' {
  export interface AgentRunInput { agentId?: string; message: string; context?: Record<string, unknown>; transientContextId?: string; }
  export interface AgentRunOutput { id: string; agentId?: string; message: string; output: string; toolCalls: string[]; createdAt: string; }
  export interface AgentRecord { id: string; name: string; instructions: string; model?: string; status: string; }
}
