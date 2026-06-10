import type { Document, Types } from 'mongoose';

export type AgentRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface IAgentRunStep {
  toolName: string;
  status: 'started' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface IAgentRun extends Document {
  _id: Types.ObjectId;
  runId: string;
  user: Types.ObjectId;
  tenantId: string;
  conversationId?: string;
  agentId?: string;
  status: AgentRunStatus;
  prompt?: string;
  steps: IAgentRunStep[];
  artifactId?: string;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
