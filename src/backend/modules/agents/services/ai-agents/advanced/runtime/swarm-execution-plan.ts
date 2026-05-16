import { roleExpectedOutput } from '../software-development-process';
import type { AdvancedAgentTask, AdvancedTaskGraph } from '../contracts/types';

export type SwarmWorkerPlan = {
  index: number;
  role: string;
  baseRole: string;
  lane: 'plan' | 'context' | 'build' | 'data' | 'workflow' | 'verify' | 'publish' | 'cleanup';
  tasks: AdvancedAgentTask[];
  dependencies: string[];
  expectedOutput: string;
  input: Record<string, unknown>;
};

const cleanRole = (role: string) => role.replace(/-\d+$/, '');
const label = (value: string) => value.replace(/[^a-zA-Z0-9 _.-]+/g, ' ').slice(0, 80).trim();
const firstTask = (tasks: AdvancedAgentTask[]) => tasks[0]?.title || 'Contribute bounded swarm work';

export const swarmRoleLane = (role: string): SwarmWorkerPlan['lane'] => {
  if (/planner|main-agent/.test(role)) return 'plan';
  if (/context|research/.test(role)) return 'context';
  if (/data|model|migration|analytics|churn|sentiment/.test(role)) return 'data';
  if (/workflow|node/.test(role)) return 'workflow';
  if (/verify|test|qa|security|accessibility|connectivity/.test(role)) return 'verify';
  if (/publisher|deployment|final-output/.test(role)) return 'publish';
  if (/cleanup/.test(role)) return 'cleanup';
  return 'build';
};

const roleMatchesTask = (role: string, task: AdvancedAgentTask) => {
  const owner = String(task.ownerRole || 'swarm-agent');
  const base = cleanRole(role);
  if (owner === role || owner === base) return true;
  if (role === 'planner' && /clarify|plan|scope/i.test(task.title)) return true;
  if (role === 'verifier' && /verify|validate|test|evidence|collect/i.test(task.title)) return true;
  if (role === 'publisher' && /publish|artifact|deployment|return/i.test(task.title)) return true;
  if (role === 'cleanup' && /cleanup|rejected|rollback/i.test(task.title)) return true;
  return owner.includes(base) || base.includes(owner.replace(/-agent$/, ''));
};

const taskShard = (tasks: AdvancedAgentTask[], index: number, count: number) =>
  tasks.filter((_, taskIndex) => taskIndex % Math.max(1, count) === index % Math.max(1, count));

const tasksForWorker = (graph: AdvancedTaskGraph, role: string, index: number, count: number) => {
  const matching = graph.tasks.filter((task) => roleMatchesTask(role, task));
  if (matching.length) return matching;
  const shard = taskShard(graph.tasks, index, Math.min(count, Math.max(1, graph.tasks.length)));
  return shard.length ? shard : graph.tasks.slice(0, 1);
};

export const buildSwarmExecutionPlan = (graph: AdvancedTaskGraph, roles: string[]): SwarmWorkerPlan[] =>
  roles.map((role, index) => {
    const tasks = tasksForWorker(graph, role, index, roles.length);
    const baseRole = cleanRole(role);
    const dependencies = Array.from(new Set(tasks.flatMap((task) => task.dependsOn || []))).filter(Boolean);
    return {
      index,
      role,
      baseRole,
      lane: swarmRoleLane(baseRole),
      tasks,
      dependencies,
      expectedOutput: roleExpectedOutput(baseRole),
      input: {
        goal: graph.goal,
        role,
        baseRole,
        lane: swarmRoleLane(baseRole),
        taskIds: tasks.map((task) => task.id),
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          dependsOn: task.dependsOn || [],
          toolHints: task.toolHints || [],
          risk: task.risk || 'none',
          expectedOutput: task.expectedOutput || roleExpectedOutput(baseRole),
        })),
        expectedOutput: roleExpectedOutput(baseRole),
      },
    };
  });

export const swarmDecisionMermaid = (graph: AdvancedTaskGraph, workers: SwarmWorkerPlan[]) => {
  const lanes = Array.from(new Set(workers.map((worker) => worker.lane)));
  const lines = ['flowchart LR', `goal["${label(graph.goal)}"]`];
  for (const lane of lanes) lines.push(`${lane}["${lane.toUpperCase()} lane"]`);
  for (const lane of lanes) lines.push(`goal --> ${lane}`);
  for (const worker of workers.slice(0, 40)) {
    const nodeId = `w${worker.index + 1}`;
    lines.push(`${nodeId}["${label(worker.role)}: ${label(firstTask(worker.tasks))}"]`);
    lines.push(`${worker.lane} --> ${nodeId}`);
  }
  lines.push('reduce["Reducer verifies outputs, artifacts, logs, and final answer"]');
  for (const lane of lanes) lines.push(`${lane} --> reduce`);
  return lines.join('\n');
};

export const summarizeSwarmWorkerPlan = (workers: SwarmWorkerPlan[]) => ({
  workerCount: workers.length,
  lanes: Array.from(new Set(workers.map((worker) => worker.lane))),
  taskCoverage: workers.reduce<Record<string, number>>((acc, worker) => {
    for (const task of worker.tasks) acc[task.id] = (acc[task.id] || 0) + 1;
    return acc;
  }, {}),
  emptyWorkers: workers.filter((worker) => worker.tasks.length === 0).map((worker) => worker.role),
});
