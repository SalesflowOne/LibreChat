import { logger } from '@librechat/data-schemas';
import { PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER, PIPEDREAM_API_BASE_URL } from './constants';

interface CachedPipedreamToken {
  accessToken: string;
  expiresAt: number;
}

const TOKEN_REFRESH_BUFFER_MS = 60_000;

let tokenCache: CachedPipedreamToken | null = null;

export function containsPipedreamTokenPlaceholder(value: string): boolean {
  return typeof value === 'string' && value.includes(PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER);
}

export function recordContainsPipedreamTokenPlaceholder(
  record: Record<string, string> | undefined,
): boolean {
  if (!record || typeof record !== 'object') {
    return false;
  }
  return Object.values(record).some(containsPipedreamTokenPlaceholder);
}

export function mcpOptionsContainPipedreamTokenPlaceholder(options: {
  headers?: Record<string, string>;
  env?: Record<string, string>;
  url?: string;
}): boolean {
  if (options.url && containsPipedreamTokenPlaceholder(options.url)) {
    return true;
  }
  if (recordContainsPipedreamTokenPlaceholder(options.headers)) {
    return true;
  }
  if (recordContainsPipedreamTokenPlaceholder(options.env)) {
    return true;
  }
  return false;
}

const pipedreamTokenRegex = new RegExp(
  PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER.replace(/[{}]/g, '\\$&'),
  'g',
);

export function isPipedreamConfigured(): boolean {
  return Boolean(process.env.PIPEDREAM_CLIENT_ID && process.env.PIPEDREAM_CLIENT_SECRET);
}

export async function getPipedreamAccessToken(): Promise<string | null> {
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  try {
    const response = await fetch(`${PIPEDREAM_API_BASE_URL}/v1/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('[Pipedream] Failed to fetch developer access token', {
        status: response.status,
        body,
      });
      return null;
    }

    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) {
      logger.error('[Pipedream] OAuth token response missing access_token');
      return null;
    }

    const expiresIn =
      typeof data.expires_in === 'number' && Number.isFinite(data.expires_in)
        ? data.expires_in
        : 3600;

    tokenCache = {
      accessToken: data.access_token,
      expiresAt: now + expiresIn * 1000,
    };

    return data.access_token;
  } catch (error) {
    logger.error('[Pipedream] Error fetching developer access token', error);
    return null;
  }
}

async function resolvePipedreamTokenPlaceholder(value: string): Promise<string> {
  if (!containsPipedreamTokenPlaceholder(value)) {
    return value;
  }

  const accessToken = await getPipedreamAccessToken();
  if (!accessToken) {
    logger.warn(
      '[Pipedream] Developer credentials are not configured; leaving access token placeholder unresolved',
    );
    return value;
  }

  return value.replace(pipedreamTokenRegex, accessToken);
}

async function resolvePipedreamTokensInRecord(
  record: Record<string, string> | undefined,
): Promise<Record<string, string> | undefined> {
  if (!record || typeof record !== 'object') {
    return record;
  }

  if (!recordContainsPipedreamTokenPlaceholder(record)) {
    return record;
  }

  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    resolved[key] = await resolvePipedreamTokenPlaceholder(value);
  }
  return resolved;
}

/**
 * Pre-processes MCP options to resolve Pipedream developer access token placeholders.
 * Must run before processMCPEnv since token resolution is async.
 */
export async function preProcessPipedreamTokens<
  T extends {
    headers?: Record<string, string>;
    env?: Record<string, string>;
    url?: string;
  },
>(options: T): Promise<T> {
  if (!mcpOptionsContainPipedreamTokenPlaceholder(options)) {
    return options;
  }

  const result = { ...options };

  if (result.url && containsPipedreamTokenPlaceholder(result.url)) {
    result.url = await resolvePipedreamTokenPlaceholder(result.url);
  }

  if (result.headers) {
    result.headers = await resolvePipedreamTokensInRecord(result.headers);
  }

  if (result.env) {
    result.env = await resolvePipedreamTokensInRecord(result.env);
  }

  return result;
}

/** Clears the in-memory developer token cache. For testing only. */
export function clearPipedreamTokenCache(): void {
  tokenCache = null;
}
