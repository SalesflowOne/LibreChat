import { logger } from '@librechat/data-schemas';
import { PIPEDREAM_API_BASE_URL } from './constants';
import { getPipedreamAccessToken } from './tokens';
import type { PipedreamAppConfig, PipedreamRuntimeConfig } from './config';

interface PipedreamCatalogAppResponse {
  name_slug: string;
  name: string;
  img_src?: string;
  description?: string | null;
}

interface ListPipedreamAppsResponse {
  data: PipedreamCatalogAppResponse[];
  page_info?: {
    end_cursor?: string | null;
    total_count?: number;
  };
}

interface CatalogCacheEntry {
  expiresAt: number;
  apps: PipedreamAppConfig[];
  nextCursor: string | null;
  totalCount?: number;
}

const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
const catalogCache = new Map<string, CatalogCacheEntry>();

function getDefaultCatalogLimit(): number {
  const parsed = Number.parseInt(process.env.PIPEDREAM_APPS_LIMIT ?? '100', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

function getCatalogCacheKey(environment: string, q?: string, limit?: number): string {
  return `${environment}:${q?.trim().toLowerCase() ?? ''}:${limit ?? getDefaultCatalogLimit()}`;
}

export function clearPipedreamCatalogCache(): void {
  catalogCache.clear();
}

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

export async function listPipedreamCatalogApps({
  environment,
  q,
  limit = getDefaultCatalogLimit(),
  after,
}: {
  environment: PipedreamRuntimeConfig['environment'];
  q?: string;
  limit?: number;
  after?: string;
}): Promise<{
  apps: PipedreamAppConfig[];
  nextCursor: string | null;
  totalCount?: number;
}> {
  const cacheKey = getCatalogCacheKey(environment, q, limit);
  if (!after) {
    const cached = catalogCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return {
        apps: cached.apps,
        nextCursor: cached.nextCursor,
        totalCount: cached.totalCount,
      };
    }
  }

  const accessToken = await getPipedreamAccessToken();
  if (!accessToken) {
    throw new Error('Pipedream developer credentials are not configured');
  }

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('sort_key', 'featured_weight');
  params.set('sort_direction', 'desc');
  params.set('has_actions', 'true');
  if (q?.trim()) {
    params.set('q', q.trim());
  }
  if (after) {
    params.set('after', after);
  }

  const response = await fetch(`${PIPEDREAM_API_BASE_URL}/v1/connect/apps?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-pd-environment': environment,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('[Pipedream] Failed to list catalog apps', {
      status: response.status,
      body,
      q,
    });
    throw new Error(`Pipedream catalog request failed (${response.status})`);
  }

  const payload = (await response.json()) as ListPipedreamAppsResponse;
  const apps = (payload.data ?? []).map((app) => ({
    slug: app.name_slug,
    name: app.name,
    iconUrl: app.img_src,
    description: app.description ?? undefined,
  }));

  const result = {
    apps,
    nextCursor: payload.page_info?.end_cursor ?? null,
    totalCount: payload.page_info?.total_count,
  };

  if (!after) {
    catalogCache.set(cacheKey, {
      ...result,
      expiresAt: Date.now() + CATALOG_CACHE_TTL_MS,
    });
  }

  return result;
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
