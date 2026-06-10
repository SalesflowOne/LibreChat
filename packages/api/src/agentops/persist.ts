import { logger } from '@librechat/data-schemas';
import type { ArtifactMethods, AgentRunMethods, IArtifactFile, ArtifactType } from '@librechat/data-schemas';
import { createPersistedArtifact } from './artifacts/service';
import { recordAgentRunStep } from './runs/service';

const TEXT_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'js',
  'jsx',
  'ts',
  'tsx',
  'json',
  'md',
  'txt',
  'svg',
  'xml',
]);

export interface AgentOpsStore extends ArtifactMethods, AgentRunMethods {}

export interface CodeExecutionFile {
  id?: string;
  name: string;
  inherited?: boolean;
  content?: string;
}

export interface PersistToolArtifactInput {
  userId: string;
  tenantId: string;
  conversationId?: string;
  messageId?: string;
  runId?: string;
  toolName: string;
  title: string;
  files: CodeExecutionFile[];
}

function extensionOf(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

function inferArtifactType(files: CodeExecutionFile[]): ArtifactType {
  const names = files.map((f) => f.name.toLowerCase());
  if (names.some((n) => n.endsWith('.html') || n.endsWith('.htm'))) {
    return 'html';
  }
  if (names.some((n) => n.endsWith('.tsx') || n.endsWith('.jsx'))) {
    return 'react';
  }
  if (names.some((n) => n.includes('dashboard'))) {
    return 'dashboard';
  }
  if (names.some((n) => n.includes('report'))) {
    return 'report';
  }
  return 'website';
}

function mapFilesToArtifactFiles(files: CodeExecutionFile[]): IArtifactFile[] {
  return files
    .filter((file) => !file.inherited && file.content?.trim())
    .map((file) => ({
      path: file.name,
      content: file.content ?? '',
      language: TEXT_EXTENSIONS.has(extensionOf(file.name)) ? extensionOf(file.name) : undefined,
    }));
}

export function isPersistableCodeFile(name: string): boolean {
  return TEXT_EXTENSIONS.has(extensionOf(name));
}

export async function persistCodeExecutionArtifact(
  store: AgentOpsStore,
  input: PersistToolArtifactInput,
): Promise<string | null> {
  const artifactFiles = mapFilesToArtifactFiles(input.files);
  if (artifactFiles.length === 0) {
    return null;
  }

  const artifact = await createPersistedArtifact(store, {
    userId: input.userId,
    tenantId: input.tenantId,
    title: input.title,
    type: inferArtifactType(input.files),
    files: artifactFiles,
    conversationId: input.conversationId,
    messageId: input.messageId,
  });

  if (input.runId) {
    await recordAgentRunStep(store, input.runId, {
      toolName: input.toolName,
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
    });
  }

  return artifact.artifactId;
}

export async function recordAgentToolStep(
  store: AgentOpsStore,
  runId: string,
  toolName: string,
  status: 'started' | 'completed' | 'failed',
  error?: string,
): Promise<void> {
  try {
    await recordAgentRunStep(store, runId, {
      toolName,
      status,
      startedAt: new Date(),
      completedAt: status !== 'started' ? new Date() : undefined,
      error,
    });
  } catch (err) {
    logger.warn('[AgentOps] Failed to record tool step', err);
  }
}
