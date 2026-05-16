import { randomUUID } from 'node:crypto';
import { parseRecordValue, parseStringValue } from 'giga-ai-helper/workflow';
import { EnvLoader } from '@giga/shared/lib/env';
import { AIAgentFeedbackEntity } from '@connectingmatrix/orm/repositories/entities';
import { searchAgentMemory as searchVectorMemory, writeAgentMemory as writeVectorMemory } from '@connectingmatrix/ai-agents/services/ai-agents/memory';
import type { AgentMemoryRecordInput } from '@connectingmatrix/ai-agents/services/ai-agents/memory';
import type { AIAgentFeedbackRow } from '@connectingmatrix/orm/repositories/entities/runtime/AIAgentFeedbackEntity';

export type AdvancedMemoryKind = AgentMemoryRecordInput['kind'];

const memoryNamespace = (input: Record<string, unknown>, agentId: string | null, userId: string, organizationId: string, sessionId: string) =>
  parseStringValue(input.namespace).trim() ||
  (agentId ? `agent:${agentId}` : sessionId ? `session:${sessionId}` : organizationId ? `organization:${organizationId}` : `user:${userId}`);

export async function writeAgentMemory(input: Record<string, unknown>) {
  const agentId = parseStringValue(input.agentId || input.agent_id).trim() || null;
  const userId = parseStringValue(input.userId || input.user_id).trim();
  const organizationId = parseStringValue(input.organizationId || input.organization_id).trim();
  const sessionId = parseStringValue(input.sessionId || input.session_id).trim();
  const content = parseStringValue(input.content || input.text || input.note).trim();
  if (!content) throw new Error('content is required to write agent memory.');
  const kind = (parseStringValue(input.kind).trim() || 'lesson') as AdvancedMemoryKind;
  const namespace = memoryNamespace(input, agentId, userId, organizationId, sessionId);
  return writeVectorMemory({
    agentId,
    body: content,
    expiresAt: parseStringValue(input.expiresAt || input.expires_at).trim() || null,
    importance: Number(input.importance || 1),
    kind,
    namespace,
    organizationId: organizationId || null,
    ownerId: agentId || userId || organizationId || null,
    ownerType: agentId ? 'agent' : organizationId ? 'organization' : 'user',
    sessionId: sessionId || null,
    title: parseStringValue(input.title).trim() || kind,
    userId: userId || null,
  });
}

export async function recordAgentFeedback(input: Record<string, unknown>) {
  const now = new Date().toISOString();
  const rating = Number(input.rating ?? input.score ?? 0);
  const content = parseStringValue(input.comment || input.content || input.feedback).trim();
  const payload: AIAgentFeedbackRow = {
    id: randomUUID(),
    agent_id: parseStringValue(input.agentId || input.agent_id).trim() || null,
    run_id: parseStringValue(input.runId || input.run_id).trim() || null,
    session_id: parseStringValue(input.sessionId || input.session_id).trim() || null,
    user_id: parseStringValue(input.userId || input.user_id).trim() || null,
    rating,
    feedback: content,
    metadata: parseRecordValue(input.metadata),
    created_at: now,
  };
  const row = await AIAgentFeedbackEntity.create(payload);
  if (content) await writeAgentMemory({ ...input, kind: 'user-feedback', content: `User feedback (${rating}): ${content}` });
  return row;
}

export async function searchAgentMemory(input: Record<string, unknown>) {
  const agentId = parseStringValue(input.agentId || input.agent_id).trim() || null;
  const userId = parseStringValue(input.userId || input.user_id).trim();
  const organizationId = parseStringValue(input.organizationId || input.organization_id).trim();
  const sessionId = parseStringValue(input.sessionId || input.session_id).trim();
  const query = parseStringValue(input.query || input.message || input.goal).trim();
  if (!query) throw new Error('query is required to search agent memory.');
  return searchVectorMemory({
    dimensions: Number(EnvLoader.get(['AGENT_MEMORY_EMBEDDING_DIMENSIONS', 'AI_AGENT_MEMORY_EMBEDDING_DIMENSIONS']) || 1536),
    embeddingModel: EnvLoader.get(['AGENT_MEMORY_EMBEDDING_MODEL', 'AI_AGENT_MEMORY_EMBEDDING_MODEL']) || 'text-embedding-3-small',
    limit: Math.max(1, Math.min(50, Number(input.limit || 12))),
    namespace: memoryNamespace(input, agentId, userId, organizationId, sessionId),
    query,
  });
}

export async function buildAgentMemoryPreamble(input: Record<string, unknown>) {
  const rows = await searchAgentMemory(input);
  if (!rows.length) return { preamble: '', memories: [] };
  const preamble = rows.map((row, index) => `${index + 1}. ${row.body}`).join('\n');
  return { preamble: `Relevant memory:\n${preamble}`, memories: rows };
}
