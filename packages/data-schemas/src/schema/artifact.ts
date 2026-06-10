import mongoose, { Schema } from 'mongoose';
import type { IArtifact } from '~/types/artifact';

const artifactFileSchema = new Schema(
  {
    path: { type: String, required: true },
    content: { type: String, required: true },
    language: { type: String },
  },
  { _id: false },
);

const artifactSchema = new Schema<IArtifact>(
  {
    artifactId: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    conversationId: { type: String, index: true },
    messageId: { type: String, index: true },
    type: {
      type: String,
      enum: ['html', 'react', 'dashboard', 'report', 'website'],
      required: true,
    },
    title: { type: String, required: true },
    files: { type: [artifactFileSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'preview', 'published', 'failed'],
      default: 'draft',
      index: true,
    },
    previewUrl: { type: String },
    deployUrl: { type: String },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);

artifactSchema.index({ tenantId: 1, updatedAt: -1 });

export default artifactSchema;
