import type { MCPOptions } from 'librechat-data-provider';
import {
  PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER,
  PIPEDREAM_MCP_HOSTS,
  PIPEDREAM_MCP_URL,
  PIPEDREAM_SERVER_PREFIX,
} from './constants';
import { isPipedreamConfigured } from './tokens';

export interface PipedreamAppConfig {
  slug: string;
  name: string;
  iconUrl?: string;
  description?: string;
}

export interface PipedreamYamlConfig {
  enabled?: boolean;
  apps?: PipedreamAppConfig[];
}

export interface PipedreamRuntimeConfig {
  enabled: boolean;
  projectId?: string;
  environment: 'development' | 'production';
  apps: PipedreamAppConfig[];
}

function parseAppsFromEnv(): PipedreamAppConfig[] {
  const raw = process.env.PIPEDREAM_APPS;
  if (!raw?.trim()) {
    return [];
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((slug) => ({
      slug,
      name: slug
        .split(/[-_]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' '),
    }));
}

export function isPipedreamProjectConfigured(): boolean {
  return isPipedreamConfigured() && Boolean(process.env.PIPEDREAM_PROJECT_ID?.trim());
}

export function resolvePipedreamEnvironment(): 'development' | 'production' {
  const raw =
    process.env.PIPEDREAM_ENVIRONMENT?.trim() ||
    process.env.PIPEDREAM_PROJECT_ENVIRONMENT?.trim();
  return raw === 'production' ? 'production' : 'development';
}

export function resolvePipedreamRuntimeConfig(
  yamlConfig?: PipedreamYamlConfig | null,
): PipedreamRuntimeConfig | null {
  if (!isPipedreamProjectConfigured()) {
    return null;
  }

  if (yamlConfig?.enabled === false) {
    return null;
  }

  const apps = yamlConfig?.apps?.length ? yamlConfig.apps : parseAppsFromEnv();

  const environment = resolvePipedreamEnvironment();

  return {
    enabled: true,
    projectId: process.env.PIPEDREAM_PROJECT_ID,
    environment,
    apps,
  };
}

export function getPipedreamServerName(appSlug: string): string {
  return `${PIPEDREAM_SERVER_PREFIX}${appSlug}`;
}

export function getPipedreamAppSlugFromServerName(serverName: string): string | null {
  if (!serverName.startsWith(PIPEDREAM_SERVER_PREFIX)) {
    return null;
  }
  const slug = serverName.slice(PIPEDREAM_SERVER_PREFIX.length);
  return slug.length > 0 ? slug : null;
}

export function isPipedreamServerName(serverName: string): boolean {
  return serverName.startsWith(PIPEDREAM_SERVER_PREFIX);
}

export function buildPipedreamMcpServerConfig(app: PipedreamAppConfig): MCPOptions {
  return {
    type: 'streamable-http',
    url: PIPEDREAM_MCP_URL,
    title: app.name,
    description:
      app.description ??
      `Connect your ${app.name} account so your agent can take actions on your behalf.`,
    iconPath: app.iconUrl,
    startup: false,
    requiresOAuth: false,
    chatMenu: true,
    headers: {
      Authorization: `Bearer ${PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER}`,
      'x-pd-project-id': '${PIPEDREAM_PROJECT_ID}',
      'x-pd-environment': '${PIPEDREAM_ENVIRONMENT}',
      'x-pd-external-user-id': '{{LIBRECHAT_USER_TENANTID}}:{{LIBRECHAT_USER_ID}}',
      'x-pd-app-slug': app.slug,
    },
  };
}

export function mergePipedreamMcpServers(
  mcpServers: Record<string, MCPOptions> | null | undefined,
  pipedreamConfig?: PipedreamYamlConfig | null,
): Record<string, MCPOptions> | null {
  const runtime = resolvePipedreamRuntimeConfig(pipedreamConfig);
  if (!runtime) {
    return mcpServers ?? null;
  }

  const merged: Record<string, MCPOptions> = { ...(mcpServers ?? {}) };
  for (const app of runtime.apps) {
    const serverName = getPipedreamServerName(app.slug);
    if (!merged[serverName]) {
      merged[serverName] = buildPipedreamMcpServerConfig(app);
    }
  }

  return merged;
}

export function mergePipedreamMcpSettings<T extends { allowedDomains?: string[] } | null>(
  mcpSettings: T,
  pipedreamConfig?: PipedreamYamlConfig | null,
): T {
  const runtime = resolvePipedreamRuntimeConfig(pipedreamConfig);
  if (!runtime) {
    return mcpSettings;
  }

  const allowedDomains = new Set(mcpSettings?.allowedDomains ?? []);
  for (const host of PIPEDREAM_MCP_HOSTS) {
    allowedDomains.add(host);
  }

  return {
    ...(mcpSettings ?? {}),
    allowedDomains: [...allowedDomains],
  } as T;
}

export function isPipedreamConnectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'pipedream.com' &&
      parsed.pathname.includes('/_static/connect.html')
    );
  } catch {
    return false;
  }
}

export function extractPipedreamConnectUrl(text: string): string | null {
  const match = text.match(/https:\/\/pipedream\.com\/_static\/connect\.html[^\s"'<>]*/);
  return match?.[0] ?? null;
}

export function appendPipedreamAppToConnectUrl(connectUrl: string, appSlug: string): string {
  try {
    const parsed = new URL(connectUrl);
    parsed.searchParams.set('app', appSlug);
    parsed.searchParams.set('connectLink', 'true');
    return parsed.toString();
  } catch {
    return connectUrl;
  }
}
