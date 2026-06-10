import { logger } from '@librechat/data-schemas';
import { PIPEDREAM_API_BASE_URL } from './constants';
import { getPipedreamAccessToken } from './tokens';
import type { PipedreamRuntimeConfig } from './config';

export interface PipedreamAccountSummary {
  id: string;
  name: string | null;
  appSlug: string;
  appName: string;
  iconUrl: string | null;
  healthy: boolean;
  dead: boolean | null;
}

interface PipedreamAccountResponse {
  id: string;
  name?: string | null;
  healthy?: boolean;
  dead?: boolean | null;
  app?: {
    name_slug?: string;
    name?: string;
    img_src?: string;
  };
}

interface PipedreamConnectTokenResponse {
  connect_link_url: string;
  token: string;
  expires_at: string;
}

async function pipedreamRequest<T>(
  path: string,
  config: PipedreamRuntimeConfig,
  init?: RequestInit,
): Promise<T> {
  const accessToken = await getPipedreamAccessToken();
  if (!accessToken) {
    throw new Error('Pipedream developer credentials are not configured');
  }

  if (!config.projectId) {
    throw new Error('PIPEDREAM_PROJECT_ID is not configured');
  }

  const response = await fetch(`${PIPEDREAM_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-pd-environment': config.environment,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('[Pipedream] API request failed', { path, status: response.status, body });
    throw new Error(`Pipedream API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function listPipedreamUserAccounts(
  externalUserId: string,
  config: PipedreamRuntimeConfig,
  appSlug?: string,
): Promise<PipedreamAccountSummary[]> {
  if (!config.projectId) {
    return [];
  }

  const query = appSlug ? `?app=${encodeURIComponent(appSlug)}` : '';
  const accounts = await pipedreamRequest<PipedreamAccountResponse[]>(
    `/v1/connect/${config.projectId}/users/${encodeURIComponent(externalUserId)}/accounts${query}`,
    config,
    { method: 'GET' },
  );

  return accounts.map((account) => ({
    id: account.id,
    name: account.name ?? null,
    appSlug: account.app?.name_slug ?? appSlug ?? '',
    appName: account.app?.name ?? account.app?.name_slug ?? appSlug ?? '',
    iconUrl: account.app?.img_src ?? null,
    healthy: account.healthy ?? true,
    dead: account.dead ?? null,
  }));
}

export interface CreatePipedreamConnectTokenParams {
  externalUserId: string;
  config: PipedreamRuntimeConfig;
  appSlug?: string;
  allowedOrigins?: string[];
  successRedirectUri?: string;
  errorRedirectUri?: string;
}

export async function createPipedreamConnectToken({
  externalUserId,
  config,
  appSlug,
  allowedOrigins,
  successRedirectUri,
  errorRedirectUri,
}: CreatePipedreamConnectTokenParams): Promise<{ connectUrl: string; expiresAt: string }> {
  if (!config.projectId) {
    throw new Error('PIPEDREAM_PROJECT_ID is not configured');
  }

  const body: Record<string, string | string[] | boolean> = {
    external_user_id: externalUserId,
  };

  if (allowedOrigins?.length) {
    body.allowed_origins = allowedOrigins;
  }
  if (successRedirectUri) {
    body.success_redirect_uri = successRedirectUri;
  }
  if (errorRedirectUri) {
    body.error_redirect_uri = errorRedirectUri;
  }

  const result = await pipedreamRequest<PipedreamConnectTokenResponse>(
    `/v1/connect/${config.projectId}/tokens`,
    config,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  let connectUrl = result.connect_link_url;
  if (appSlug) {
    const parsed = new URL(connectUrl);
    parsed.searchParams.set('app', appSlug);
    parsed.searchParams.set('connectLink', 'true');
    connectUrl = parsed.toString();
  }

  return {
    connectUrl,
    expiresAt: result.expires_at,
  };
}
