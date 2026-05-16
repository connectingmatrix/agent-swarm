import { ENTITY, FIELD, PERMISSIONS, Entity } from '@connectingmatrix/orm/orm';

export type AIAgentSwarmRow = {
  id: string;
  agent_id?: string | null;
  workflow_id?: string | null;
  workflow_execution_id?: string | null;
  owner_type?: string | null;
  owner_id?: string | null;
  organization_id?: string | null;
  chat_id?: string | null;
  goal?: string | null;
  status?: string | null;
  plan?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requires_confirmation?: boolean | null;
  confirmed_at?: string | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
};

@ENTITY({ table: 'ai_agent_swarms', label: 'AIAgentSwarm', store: 'supabase', primaryKey: 'id' })
@PERMISSIONS({
  read: 'AI_AGENT_SWARM_READ',
  list: 'AI_AGENT_SWARM_LIST',
  create: 'AI_AGENT_SWARM_CREATE',
  update: 'AI_AGENT_SWARM_UPDATE',
  delete: 'AI_AGENT_SWARM_DELETE',
})
export class AIAgentSwarmEntity extends Entity<AIAgentSwarmRow> {
  @FIELD({ type: 'string', required: true, index: true }) public declare id: string | null;

  @FIELD({ type: 'string', index: true }) public declare agent_id: string | null;

  @FIELD({ type: 'string', index: true }) public declare workflow_id: string | null;

  @FIELD({ type: 'string', index: true }) public declare workflow_execution_id: string | null;

  @FIELD({ type: 'string', required: true, index: true, default: 'user' }) public declare owner_type: string | null;

  @FIELD({ type: 'string', index: true }) public declare owner_id: string | null;

  @FIELD({ type: 'string', index: true }) public declare organization_id: string | null;

  @FIELD({ type: 'string', index: true }) public declare chat_id: string | null;

  @FIELD({ type: 'string', required: true }) public declare goal: string | null;

  @FIELD({ type: 'string', required: true, default: 'planning' }) public declare status: string | null;

  @FIELD({ type: 'object', default: {} }) public declare plan: Record<string, unknown> | null;

  @FIELD({ type: 'object', default: {} }) public declare result: Record<string, unknown> | null;

  @FIELD({ type: 'object', default: {} }) public declare metadata: Record<string, unknown> | null;

  @FIELD({ type: 'boolean', default: false }) public declare requires_confirmation: boolean | null;

  @FIELD({ type: 'string' }) public declare confirmed_at: string | null;

  @FIELD({ type: 'string', index: true }) public declare created_by: string | null;

  @FIELD({ type: 'string' }) public declare created_at: string | null;

  @FIELD({ type: 'string' }) public declare updated_at: string | null;

  @FIELD({ type: 'string' }) public declare completed_at: string | null;
}
