export type ArtifactType = 'html' | 'react' | 'dashboard' | 'report' | 'website';
export type ArtifactStatus = 'draft' | 'preview' | 'published' | 'failed';

export interface ArtifactFile {
  path: string;
  content: string;
  language?: string;
}

export interface ArtifactRecord {
  artifactId: string;
  tenantId: string;
  conversationId?: string;
  messageId?: string;
  type: ArtifactType;
  title: string;
  files: ArtifactFile[];
  status: ArtifactStatus;
  previewUrl?: string;
  deployUrl?: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtifactsListResponse {
  artifacts: ArtifactRecord[];
}

export interface ArtifactResponse {
  artifact: ArtifactRecord;
}

export interface CreateArtifactRequest {
  title: string;
  type: ArtifactType;
  files: ArtifactFile[];
  conversationId?: string;
  messageId?: string;
}

export type SpaceStatus = 'pending' | 'building' | 'ready' | 'failed';
export type SpaceProvider = 'vercel' | 'coolify';

export interface SpaceRecord {
  spaceId: string;
  artifactId: string;
  tenantId: string;
  name: string;
  url?: string;
  status: SpaceStatus;
  provider: SpaceProvider;
  deploymentId?: string;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpacesListResponse {
  spaces: SpaceRecord[];
}

export interface DeploySpaceRequest {
  artifactId: string;
  name?: string;
}

export interface DeploySpaceResponse {
  space: SpaceRecord;
  url?: string;
}

export type AgentRunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentRunStep {
  toolName: string;
  status: 'started' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AgentRunRecord {
  runId: string;
  tenantId: string;
  conversationId?: string;
  agentId?: string;
  status: AgentRunStatus;
  prompt?: string;
  steps: AgentRunStep[];
  artifactId?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentRunsListResponse {
  runs: AgentRunRecord[];
}

export interface ClerkExchangeResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
  };
}
