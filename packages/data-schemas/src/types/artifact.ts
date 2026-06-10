import type { Document, Types } from 'mongoose';

export type ArtifactType = 'html' | 'react' | 'dashboard' | 'report' | 'website';
export type ArtifactStatus = 'draft' | 'preview' | 'published' | 'failed';

export interface IArtifactFile {
  path: string;
  content: string;
  language?: string;
}

export interface IArtifact extends Document {
  _id: Types.ObjectId;
  artifactId: string;
  user: Types.ObjectId;
  tenantId: string;
  conversationId?: string;
  messageId?: string;
  type: ArtifactType;
  title: string;
  files: IArtifactFile[];
  status: ArtifactStatus;
  previewUrl?: string;
  deployUrl?: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
