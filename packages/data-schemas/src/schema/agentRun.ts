import mongoose, { Schema } from 'mongoose';
import type { IAgentRun } from '~/types/agentRun';

const agentRunStepSchema = new Schema(
  {
    toolName: { type: String, required: true },
    status: { type: String, enum: ['started', 'completed', 'failed'], required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    error: { type: String },
  },
  { _id: false },
);

const agentRunSchema = new Schema<IAgentRun>(
  {
    runId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    conversationId: { type: String, index: true },
    agentId: { type: String, index: true },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed', 'cancelled'],
      default: 'running',
      index: true,
    },
    prompt: { type: String },
    steps: { type: [agentRunStepSchema], default: [] },
    artifactId: { type: String },
    errorMessage: { type: String },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

agentRunSchema.index({ tenantId: 1, startedAt: -1 });

export default agentRunSchema;
