import mongoose, { Schema } from 'mongoose';
import type { ISpace } from '~/types/space';

const spaceSchema = new Schema<ISpace>(
  {
    spaceId: { type: String, required: true, unique: true, index: true },
    artifactId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    url: { type: String },
    status: {
      type: String,
      enum: ['pending', 'building', 'ready', 'failed'],
      default: 'pending',
      index: true,
    },
    provider: {
      type: String,
      enum: ['vercel', 'coolify'],
      default: 'vercel',
    },
    deploymentId: { type: String },
    errorMessage: { type: String },
  },
  { timestamps: true },
);

spaceSchema.index({ tenantId: 1, updatedAt: -1 });

export default spaceSchema;
