import type { ArtifactMethods } from '@librechat/data-schemas';
import type { ArtifactType, IArtifact, IArtifactFile } from '@librechat/data-schemas';

export interface ArtifactStore extends ArtifactMethods {}

export interface CreatePersistedArtifactInput {
  userId: string;
  tenantId: string;
  title: string;
  type: ArtifactType;
  files: IArtifactFile[];
  conversationId?: string;
  messageId?: string;
}

export async function createPersistedArtifact(
  store: ArtifactStore,
  input: CreatePersistedArtifactInput,
): Promise<IArtifact> {
  return store.createArtifact({
    ...input,
    status: 'draft',
  });
}

export async function listTenantArtifacts(
  store: ArtifactStore,
  tenantId: string,
  options?: { limit?: number },
): Promise<IArtifact[]> {
  return store.listArtifacts({ tenantId }, options);
}

export async function getTenantArtifact(
  store: ArtifactStore,
  tenantId: string,
  artifactId: string,
): Promise<IArtifact | null> {
  const artifact = await store.getArtifactById(artifactId);
  if (!artifact || artifact.tenantId !== tenantId) {
    return null;
  }
  return artifact;
}

export function buildArtifactPreviewHtml(files: IArtifactFile[]): string {
  const index = files.find((f) => f.path === 'index.html' || f.path.endsWith('/index.html'));
  if (index?.content) {
    return index.content;
  }
  const html = files.find((f) => f.path.endsWith('.html'));
  if (html?.content) {
    return html.content;
  }
  const reactEntry = files.find((f) => f.path === 'App.tsx' || f.path === 'App.jsx');
  if (reactEntry) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Preview</title></head><body><div id="root"></div><pre style="padding:1rem;font-family:monospace;white-space:pre-wrap">${escapeHtml(reactEntry.content)}</pre></body></html>`;
  }
  const first = files[0];
  if (!first) {
    return '<!DOCTYPE html><html><body><p>No preview available</p></body></html>';
  }
  return `<!DOCTYPE html><html><body><pre style="padding:1rem;font-family:monospace;white-space:pre-wrap">${escapeHtml(first.content)}</pre></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
