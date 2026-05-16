import { agentCapabilityCatalogOperation, agentOperation, bindAgentWorkflowOperation, createAgentOperation, deleteAgentFileOperation, deleteAgentOperation, rebuildAgentIngestionOperation, selectableAgentsOperation, updateAgentIngestionOperation, updateAgentOperation } from '@giga/dataloader/client/legacy/orm';
import type { AIAgentRecord, AgentCapabilityCatalog, AgentCreateInput, AgentRebuildIngestionInput, AgentUpdateIngestionInput } from '@giga/dataloader/client/legacy/orm';
import type { UiDataContext } from '@giga/dataloader/client/legacy/dataloaders/context';
import { assertCanPerform } from '@giga/dataloader/client/legacy/dataloaders/permissions.loader';

type AgentUpdatePatch = Partial<AgentCreateInput> & { isActive?: boolean };

export const listAgents = async (context: UiDataContext, search = ''): Promise<AIAgentRecord[]> => {
    assertCanPerform(context.policy, 'AIAgent', 'list');
    return (await selectableAgentsOperation(context.policy.scope, search)).rows;
};

export const loadAgent = async (context: UiDataContext, id: string): Promise<AIAgentRecord> => {
    assertCanPerform(context.policy, 'AIAgent', 'read');
    return agentOperation(id);
};

export const createAgent = async (context: UiDataContext, input: AgentCreateInput): Promise<AIAgentRecord> => {
    assertCanPerform(context.policy, 'AIAgent', 'create');
    return createAgentOperation(input);
};

export const updateAgent = async (context: UiDataContext, id: string, input: AgentUpdatePatch): Promise<AIAgentRecord> => {
    assertCanPerform(context.policy, 'AIAgent', 'update');
    return updateAgentOperation({ ...input, id });
};

export const updateAgentStatus = async (context: UiDataContext, id: string, status: string): Promise<AIAgentRecord> => {
    return updateAgent(context, id, { isActive: status !== 'inactive' });
};

export const deleteAgent = async (context: UiDataContext, id: string): Promise<void> => {
    assertCanPerform(context.policy, 'AIAgent', 'delete');
    await deleteAgentOperation(id);
};

export const loadAgentCapabilityCatalog = async (context: UiDataContext): Promise<AgentCapabilityCatalog> => {
    assertCanPerform(context.policy, 'AIAgent', 'read');
    return agentCapabilityCatalogOperation();
};

export const bindAgentWorkflow = async (context: UiDataContext, agentId: string, workflowId: string, permissionId = 'workflow.execute') => {
    assertCanPerform(context.policy, 'AIAgent', 'update');
    return bindAgentWorkflowOperation({ agentId, workflowId, permissionId });
};


export const updateAgentIngestion = async (context: UiDataContext, input: AgentUpdateIngestionInput) => {
    assertCanPerform(context.policy, 'AIAgent', 'update');
    return updateAgentIngestionOperation(input);
};

export const rebuildAgentIngestion = async (context: UiDataContext, input: AgentRebuildIngestionInput) => {
    assertCanPerform(context.policy, 'AIAgent', 'execute');
    return rebuildAgentIngestionOperation(input);
};

export const deleteAgentFile = async (context: UiDataContext, agentId: string, attachmentId: string) => {
    assertCanPerform(context.policy, 'AIAgent', 'delete');
    return deleteAgentFileOperation(agentId, attachmentId);
};
