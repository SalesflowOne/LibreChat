import { logger } from '@librechat/data-schemas';
import type { IArtifact, ISpace, SpaceMethods } from '@librechat/data-schemas';
import { buildArtifactPreviewHtml } from '../artifacts/service';

export interface SpaceStore extends SpaceMethods {}

export interface DeploySpaceInput {
  userId: string;
  tenantId: string;
  artifact: IArtifact;
  name?: string;
}

export interface DeploySpaceResult {
  space: ISpace;
  url?: string;
}

async function deployToVercel({
  name,
  html,
}: {
  name: string;
  html: string;
}): Promise<{ url: string; deploymentId: string } | null> {
  const token = process.env.VERCEL_TOKEN?.trim();
  const project = process.env.AGENTOPS_VERCEL_PROJECT?.trim() || 'agent-workspace';
  const teamId = process.env.VERCEL_TEAM_ID?.trim();

  if (!token) {
    return null;
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);

  const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
  const response = await fetch(`https://api.vercel.com/v13/deployments${query}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: slug,
      project,
      target: 'production',
      files: [
        {
          file: 'index.html',
          data: html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('[Spaces] Vercel deploy failed', { status: response.status, body });
    return null;
  }

  const data = (await response.json()) as { url?: string; id?: string };
  if (!data.url || !data.id) {
    return null;
  }
  return {
    url: data.url.startsWith('http') ? data.url : `https://${data.url}`,
    deploymentId: data.id,
  };
}

async function deployToCoolify({
  serviceUuid,
}: {
  serviceUuid: string;
}): Promise<{ deploymentId: string } | null> {
  const coolifyUrl = process.env.COOLIFY_URL?.trim();
  const coolifyToken = process.env.COOLIFY_API_TOKEN?.trim();
  if (!coolifyUrl || !coolifyToken) {
    return null;
  }

  const response = await fetch(
    `${coolifyUrl.replace(/\/$/, '')}/api/v1/deploy?uuid=${encodeURIComponent(serviceUuid)}&force=true`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${coolifyToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    logger.error('[Spaces] Coolify deploy failed', { status: response.status, body });
    return null;
  }

  const data = (await response.json()) as {
    deployments?: Array<{ deployment_uuid?: string }>;
  };
  const deploymentId = data.deployments?.[0]?.deployment_uuid;
  if (!deploymentId) {
    return null;
  }
  return { deploymentId };
}

export async function deployArtifactAsSpace(
  store: SpaceStore,
  input: DeploySpaceInput,
): Promise<DeploySpaceResult> {
  const name = input.name?.trim() || input.artifact.title || 'space';
  const space = await store.createSpace({
    userId: input.userId,
    tenantId: input.tenantId,
    artifactId: input.artifact.artifactId,
    name,
    provider: 'vercel',
  });

  await store.updateSpace(space.spaceId, { status: 'building' });

  const html = buildArtifactPreviewHtml(input.artifact.files ?? []);
  const vercel = await deployToVercel({ name, html });

  if (vercel) {
    const updated = await store.updateSpace(space.spaceId, {
      status: 'ready',
      url: vercel.url,
      deploymentId: vercel.deploymentId,
      provider: 'vercel',
    });
    return { space: updated ?? space, url: vercel.url };
  }

  const coolifyUuid = process.env.AGENTOPS_COOLIFY_SPACE_UUID?.trim();
  if (coolifyUuid) {
    const coolify = await deployToCoolify({ serviceUuid: coolifyUuid });
    if (coolify) {
      const fallbackUrl = process.env.AGENTOPS_COOLIFY_SPACE_URL?.trim();
      const updated = await store.updateSpace(space.spaceId, {
        status: fallbackUrl ? 'ready' : 'building',
        url: fallbackUrl,
        deploymentId: coolify.deploymentId,
        provider: 'coolify',
      });
      return { space: updated ?? space, url: fallbackUrl };
    }
  }

  const failed = await store.updateSpace(space.spaceId, {
    status: 'failed',
    errorMessage: 'Deploy failed on Vercel and Coolify fallback',
  });
  return { space: failed ?? space };
}
