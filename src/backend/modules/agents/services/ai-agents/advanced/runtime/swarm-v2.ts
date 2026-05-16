import { randomUUID } from 'node:crypto';
import { parseRecordValue, parseStringValue, parseUnknownArray } from 'giga-ai-helper/workflow';
import { AIAgentSwarmEntity, AIAgentSwarmWorkerEntity } from '@connectingmatrix/orm/repositories/entities';
import { emitRuntimeEvent } from '@giga/process-monitoring/socket/runtime/event-bus';
import { createAgentTaskGraph } from './task-graph';
import { selectSwarmRoles, swarmWorkerMetadata } from './swarm-roles';
import type { AIAgentSwarmRow } from '@connectingmatrix/orm/repositories/entities/runtime/AIAgentSwarmEntity';
import type { AIAgentSwarmWorkerRow } from '@connectingmatrix/orm/repositories/entities/runtime/AIAgentSwarmWorkerEntity';

const text = (value: unknown): string => parseStringValue(value).trim();
const record = (value: unknown): Record<string, unknown> => parseRecordValue(value);

export function planAdvancedSwarm(input: Record<string, unknown>) {
  const graph = createAgentTaskGraph({ ...input, mode: 'swarm' });
  const requested: string[] = [];
  for (const role of parseUnknownArray(input.roles)) {
    const value = text(role);
    if (value) requested.push(value);
  }
  const roles = selectSwarmRoles(input, graph, requested);
  return {
    status: input.confirmed === true ? 'ready' : 'confirmation_required',
    confirmationId: input.confirmed === true ? null : `confirm-${randomUUID()}`,
    reason:
      input.confirmed === true
        ? null
        : 'Launching a multi-agent swarm can create workflows, generated code, files, hosted apps, and local-runner jobs.',
    graph,
    roles,
    proposedActions: roles.map((role) => ({ tool: 'agent.swarm.worker', args: { role }, effect: `Create and run ${role} worker` })),
  };
}

export async function launchAdvancedSwarm(input: Record<string, unknown>) {
  const plan = planAdvancedSwarm(input);
  if (plan.status === 'confirmation_required') return plan;
  const now = new Date().toISOString();
  const swarmPayload: AIAgentSwarmRow = {
    id: randomUUID(),
    agent_id: text(input.agentId || input.agent_id) || null,
    owner_type: text(input.ownerType || input.owner_type) || 'user',
    owner_id: text(input.ownerId || input.owner_id || input.userId || input.user_id) || null,
    organization_id: text(input.organizationId || input.organization_id) || null,
    chat_id: text(input.chatId || input.chat_id) || null,
    goal: plan.graph.goal,
    status: 'running',
    plan: plan.graph,
    metadata: { source: 'agent.swarm.v2', requested: record(input) },
    created_by: text(input.userId || input.created_by) || null,
    created_at: now,
    updated_at: now,
  };
  const swarm = await AIAgentSwarmEntity.create(swarmPayload);
  const swarmId = text(swarm.id);
  const workers = [];
  const roles = plan.roles.slice(0, 200);
  for (const [index, role] of roles.entries()) {
    const workerPayload: AIAgentSwarmWorkerRow = {
      id: randomUUID(),
      swarm_id: swarmId,
      role,
      status: 'planned',
      index,
      input: {
        goal: plan.graph.goal,
        role,
        tasks: plan.graph.tasks.filter((task) => task.ownerRole === role || role === 'planner' || role === 'verifier' || role === 'swarm-agent'),
      },
      output: {},
      artifacts: [],
      metadata: swarmWorkerMetadata(swarmId, role, index),
      created_at: now,
      updated_at: now,
    };
    const worker = await AIAgentSwarmWorkerEntity.create(workerPayload);
    workers.push(worker);
    emitRuntimeEvent({
      kind: 'swarm.worker',
      message: `Swarm worker planned: ${role}`,
      status: 'planned',
      swarmId,
      timestamp: now,
      userId: swarmPayload.created_by || swarmPayload.owner_id || null,
      workerId: text(worker.id) || null,
    });
  }
  return { status: 'running', swarm, workers, graph: plan.graph };
}

export async function collectAdvancedSwarm(input: Record<string, unknown>) {
  const swarmId = text(input.swarmId || input.swarm_id);
  if (!swarmId) throw new Error('swarmId is required.');
  const workers = await AIAgentSwarmWorkerEntity.find({ swarm_id: swarmId }).many();
  return {
    swarmId,
    workers,
    summary: `Collected ${Array.isArray(workers) ? workers.length : 0} swarm worker result(s).`,
    outputs: (Array.isArray(workers) ? workers : []).map((worker) => ({
      role: worker.role,
      status: worker.status,
      output: worker.output,
      artifacts: worker.artifacts,
    })),
  };
}
