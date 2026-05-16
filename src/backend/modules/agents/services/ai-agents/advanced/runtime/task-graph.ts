import { randomUUID } from 'node:crypto';
import { identifyAdvancedGaps, gapsToTasks } from './gap-analysis';
import type { AdvancedAgentTask, AdvancedTaskGraph, AdvancedAgentMode, AdvancedRisk } from '../contracts/types';

const text = (value: unknown) => String(value ?? '').trim();
const words = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((x) => x.length > 2);

function task(id: string, title: string, ownerRole: string, toolHints: string[] = [], risk: AdvancedRisk = 'none'): AdvancedAgentTask {
  return { id, title, status: 'pending', ownerRole, toolHints, risk };
}

export function createAgentTaskGraph(input: Record<string, unknown>): AdvancedTaskGraph {
  const now = new Date().toISOString();
  const goal = text(input.goal || input.message || input.prompt || 'Complete user request');
  const lower = goal.toLowerCase();
  const tasks: AdvancedAgentTask[] = [];
  const add = (title: string, role: string, tools: string[] = [], risk: AdvancedRisk = 'none') =>
    tasks.push(task(`t${tasks.length + 1}`, title, role, tools, risk));

  add('Clarify goal, constraints, permissions, output format, and risk level.', 'planner', ['agent.memory.search', 'entity.capabilities']);
  add('Load relevant memory, previous artifacts, entity capabilities, node capabilities, and Giga knowledge if needed.', 'context-loader', [
    'agent.memory.search',
    'knowledge.giga.search',
  ]);

  if (/giga|platform|repo|fix|bug|build|typescript|graphql/i.test(goal)) {
    add('Inspect platform context and produce a safe platform fix plan.', 'platform-fix-agent', ['platform.fix.plan'], 'write');
  }
  if (/workflow|automate|execute|publish|attach|node|agent/i.test(goal)) {
    add(
      'Design workflow graph using node manifests, entity tools, and confirmation nodes for risky steps.',
      'workflow-builder',
      ['workflow.compile', 'workflow.operation'],
      'write',
    );
    add('Validate workflow ports, edges, credentials, permissions, and runtime limits.', 'workflow-verifier', ['workflow.operation']);
  }
  if (/software|app|react|sqlite|orm|host|runner|electron|game|three|management|hospital|school|rcm|practice|edtech/i.test(goal)) {
    add(
      'Generate software system spec, files, SQLite schema/ORM, UI, tests, and run commands.',
      'software-architect',
      ['agent.software.create'],
      'write',
    );
    add(
      'Queue sandbox or local-runner build, run, and host job after approval.',
      'software-runner',
      ['agent.software.run', 'agent.software.host', 'agent.local_runner.job'],
      'local-computer',
    );
  }
  if (/map|gis|geo|coordinate|population|country|world|route|heatmap|choropleth|turbulence/i.test(goal)) {
    add('Build GIS/chart spec with all-country support, coordinate fields, labels, legends, and operations.', 'gis-cartographer', [
      'gis.operation',
      'chart.render',
    ]);
  }
  if (/image|sprite|edit|crop|resize|mask|logo|picture/i.test(goal)) {
    add(
      'Create image manipulation or sprite-sheet job and publish output artifacts.',
      'image-studio',
      ['image.operation', 'image.sprite_sheet'],
      'write',
    );
  }
  if (/csv|excel|zip|pdf|file|dataset|3gb|large/i.test(goal)) {
    add(
      'Plan attachment ingestion, streaming SQL materialization, zip tree extraction, and artifact output.',
      'data-loader',
      ['file.ingest', 'file.queryDuckDB'],
      'write',
    );
  }
  if (/swarm|complex|entire|architecture|manager|training|analysis|delegate|multi/i.test(goal)) {
    add('Launch bounded specialist swarm only after confirmation and track worker outputs.', 'swarm-manager', ['agent.swarm.v2'], 'long-running');
  }

  add('Execute safe steps, collect evidence, update memory, publish artifacts, and return structured output.', 'executor-verifier', [
    'artifact.publish',
    'agent.memory.write',
  ]);

  const gaps = input.includeGaps === true ? gapsToTasks(identifyAdvancedGaps(input)) : [];
  const allTasks = [...gaps, ...tasks].map((item, index) => ({ ...item, id: item.id || `t${index + 1}` }));
  const confirmationRequired = allTasks.some(
    (item) =>
      ['destructive', 'admin', 'external-network', 'local-computer', 'package-install', 'long-running', 'write'].includes(String(item.risk)) &&
      input.confirmed !== true,
  );

  return {
    id: text(input.id) || randomUUID(),
    goal,
    mode: (text(input.mode) as AdvancedAgentMode) || 'chat',
    tasks: allTasks,
    artifacts: [],
    warnings: words(goal).length > 150 ? ['Large prompt detected; the agent should chunk knowledge and preserve a task graph.'] : [],
    confirmationRequired,
    confirmationReason: confirmationRequired
      ? 'This request includes write, local-computer, long-running, or architecture-building work and requires confirmation.'
      : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTaskStatus(
  graph: AdvancedTaskGraph,
  taskId: string,
  status: AdvancedAgentTask['status'],
  evidence?: string,
): AdvancedTaskGraph {
  const now = new Date().toISOString();
  return {
    ...graph,
    updatedAt: now,
    tasks: graph.tasks.map((task) =>
      task.id === taskId ? { ...task, status, evidence: evidence ? [...(task.evidence || []), evidence] : task.evidence } : task,
    ),
  };
}
