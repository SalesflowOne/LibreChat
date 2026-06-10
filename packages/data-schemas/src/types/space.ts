import type { Document, Types } from 'mongoose';

export type SpaceStatus = 'pending' | 'building' | 'ready' | 'failed';
export type SpaceProvider = 'vercel' | 'coolify';

export interface ISpace extends Document {
  _id: Types.ObjectId;
  spaceId: string;
  artifactId: string;
  user: Types.ObjectId;
  tenantId: string;
  name: string;
  url?: string;
  status: SpaceStatus;
  provider: SpaceProvider;
  deploymentId?: string;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
