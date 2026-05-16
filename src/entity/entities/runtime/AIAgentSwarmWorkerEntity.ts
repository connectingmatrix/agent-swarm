import { ENTITY, FIELD, PERMISSIONS, Entity } from '@connectingmatrix/orm/orm';

export type AIAgentSwarmWorkerRow = {
  id: string;
  swarm_id: string;
  role: string;
  agent_id?: string | null;
  workflow_id?: string | null;
  task?: string | null;
  status?: string | null;
  index?: number | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  artifacts?: Array<Record<string, unknown>> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
};

@ENTITY({ table: 'ai_agent_swarm_workers', label: 'AIAgentSwarmWorker', store: 'supabase', primaryKey: 'id' })
@PERMISSIONS({
  read: 'AI_AGENT_SWARM_WORKER_READ',
  list: 'AI_AGENT_SWARM_WORKER_LIST',
  create: 'AI_AGENT_SWARM_WORKER_CREATE',
  update: 'AI_AGENT_SWARM_WORKER_UPDATE',
  delete: 'AI_AGENT_SWARM_WORKER_DELETE',
})
export class AIAgentSwarmWorkerEntity extends Entity<AIAgentSwarmWorkerRow> {
  @FIELD({ type: 'string', required: true, index: true }) public declare id: string | null;

  @FIELD({ type: 'string', required: true, index: true }) public declare swarm_id: string | null;

  @FIELD({ type: 'string', required: true, index: true }) public declare role: string | null;

  @FIELD({ type: 'string', index: true }) public declare agent_id: string | null;

  @FIELD({ type: 'string', index: true }) public declare workflow_id: string | null;

  @FIELD({ type: 'string' }) public declare task: string | null;

  @FIELD({ type: 'string', required: true, default: 'queued' }) public declare status: string | null;

  @FIELD({ type: 'number' }) public declare index: number | null;

  @FIELD({ type: 'object', default: {} }) public declare input: Record<string, unknown> | null;

  @FIELD({ type: 'object', default: {} }) public declare output: Record<string, unknown> | null;

  @FIELD({ type: 'array', default: [] }) public declare artifacts: Array<Record<string, unknown>> | null;

  @FIELD({ type: 'object', default: {} }) public declare metadata: Record<string, unknown> | null;

  @FIELD({ type: 'string' }) public declare created_at: string | null;

  @FIELD({ type: 'string' }) public declare updated_at: string | null;

  @FIELD({ type: 'string' }) public declare started_at: string | null;

  @FIELD({ type: 'string' }) public declare completed_at: string | null;
}
