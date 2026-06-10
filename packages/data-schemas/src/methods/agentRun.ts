import { randomUUID } from 'crypto';
import type { FilterQuery } from 'mongoose';
import type { IAgentRun, IAgentRunStep, AgentRunStatus } from '~/types/agentRun';

export interface CreateAgentRunInput {
  userId: string;
  tenantId: string;
  conversationId?: string;
  agentId?: string;
  prompt?: string;
}

export function createAgentRunMethods(mongoose: typeof import('mongoose')) {
  async function createAgentRun(input: CreateAgentRunInput): Promise<IAgentRun> {
    const AgentRun = mongoose.models.AgentRun;
    const doc = await AgentRun.create({
      runId: randomUUID(),
      user: input.userId,
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      agentId: input.agentId,
      prompt: input.prompt,
      status: 'running',
      steps: [],
      startedAt: new Date(),
    });
    return doc.toObject() as IAgentRun;
  }

  async function listAgentRuns(
    filter: FilterQuery<IAgentRun>,
    options?: { limit?: number },
  ): Promise<IAgentRun[]> {
    const AgentRun = mongoose.models.AgentRun;
    const query = AgentRun.find(filter).sort({ startedAt: -1 });
    if (options?.limit) {
      query.limit(options.limit);
    }
    return query.lean<IAgentRun[]>();
  }

  async function getAgentRunById(runId: string): Promise<IAgentRun | null> {
    const AgentRun = mongoose.models.AgentRun;
    return AgentRun.findOne({ runId }).lean<IAgentRun | null>();
  }

  async function appendAgentRunStep(
    runId: string,
    step: IAgentRunStep,
  ): Promise<IAgentRun | null> {
    const AgentRun = mongoose.models.AgentRun;
    return AgentRun.findOneAndUpdate(
      { runId },
      { $push: { steps: step } },
      { new: true },
    ).lean<IAgentRun | null>();
  }

  async function completeAgentRun(
    runId: string,
    update: { status: AgentRunStatus; artifactId?: string; errorMessage?: string },
  ): Promise<IAgentRun | null> {
    const AgentRun = mongoose.models.AgentRun;
    return AgentRun.findOneAndUpdate(
      { runId },
      {
        $set: {
          status: update.status,
          artifactId: update.artifactId,
          errorMessage: update.errorMessage,
          completedAt: new Date(),
        },
      },
      { new: true },
    ).lean<IAgentRun | null>();
  }

  return {
    createAgentRun,
    listAgentRuns,
    getAgentRunById,
    appendAgentRunStep,
    completeAgentRun,
  };
}

export type AgentRunMethods = ReturnType<typeof createAgentRunMethods>;
