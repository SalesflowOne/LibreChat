import type { AgentRunMethods, IAgentRun, IAgentRunStep } from '@librechat/data-schemas';

export interface AgentRunStore extends AgentRunMethods {}

export async function startAgentRun(
  store: AgentRunStore,
  input: {
    userId: string;
    tenantId: string;
    conversationId?: string;
    agentId?: string;
    prompt?: string;
  },
): Promise<IAgentRun> {
  return store.createAgentRun(input);
}

export async function recordAgentRunStep(
  store: AgentRunStore,
  runId: string,
  step: IAgentRunStep,
): Promise<IAgentRun | null> {
  return store.appendAgentRunStep(runId, step);
}

export async function finishAgentRun(
  store: AgentRunStore,
  runId: string,
  input: { status: 'completed' | 'failed' | 'cancelled'; artifactId?: string; errorMessage?: string },
): Promise<IAgentRun | null> {
  return store.completeAgentRun(runId, input);
}

export async function listTenantAgentRuns(
  store: AgentRunStore,
  tenantId: string,
  options?: { limit?: number },
): Promise<IAgentRun[]> {
  return store.listAgentRuns({ tenantId }, options);
}
