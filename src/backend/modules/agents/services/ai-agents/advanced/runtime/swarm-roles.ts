import { roleExpectedOutput, softwareDevelopmentRoles } from '../software-development-process';
import type { AdvancedTaskGraph } from '../contracts/types';

const baseRoles = [
  'planner',
  'researcher',
  'workflow-builder',
  'node-builder',
  'software-architect',
  'data-loader',
  'gis-cartographer',
  'image-studio',
  'swarm-agent',
  'debugger',
  'verifier',
  'publisher',
  'cleanup',
];

const requiredRoles = ['planner', 'verifier', 'publisher', 'cleanup'];
const softwareProcessPrompt = (value: string) => /software|application|app|pwa|deployment|requirement|product/i.test(value);

export const selectSwarmRoles = (
  input: { prompt?: unknown; message?: unknown; goal?: unknown },
  graph: AdvancedTaskGraph,
  requested: string[],
): string[] => {
  if (requested.length) return requested;
  if (softwareProcessPrompt(`${input.prompt || input.message || input.goal || ''} ${graph.goal}`))
    return Array.from(new Set<string>([...baseRoles, ...softwareDevelopmentRoles]));
  return baseRoles.filter(
    (role) =>
      graph.tasks.some((task) => task.ownerRole === role || String(task.ownerRole || '').includes(role.split('-')[0])) ||
      requiredRoles.includes(role),
  );
};

export const swarmWorkerMetadata = (swarmId: string, role: string, index: number) => {
  const lifecycleStep = softwareDevelopmentRoles.findIndex((value) => value === role) + 1 || index + 1;
  return {
    memory_scope_id: `${swarmId}:${role}:${index}`,
    can_launch_swarm: role === 'swarm-agent' || role.endsWith('-swarm'),
    lineage: { parent_swarm_id: null, child_swarm_depth: role.endsWith('-swarm') ? 1 : 0 },
    assigned_lifecycle_step: lifecycleStep,
    expected_output: roleExpectedOutput(role),
    artifact_paths: [],
    verification_status: 'planned',
  };
};
