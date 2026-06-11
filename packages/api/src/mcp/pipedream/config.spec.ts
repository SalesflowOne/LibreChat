jest.mock('@librechat/data-schemas', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

import {
  buildPipedreamMcpServerConfig,
  extractPipedreamConnectUrl,
  getPipedreamServerName,
  mergePipedreamMcpServers,
  mergePipedreamMcpSettings,
  resolvePipedreamRuntimeConfig,
} from './config';

describe('Pipedream config', () => {
  const originalClientId = process.env.PIPEDREAM_CLIENT_ID;
  const originalClientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const originalProjectId = process.env.PIPEDREAM_PROJECT_ID;
  const originalEnvironment = process.env.PIPEDREAM_ENVIRONMENT;
  const originalApps = process.env.PIPEDREAM_APPS;

  beforeEach(() => {
    process.env.PIPEDREAM_CLIENT_ID = 'test-client-id';
    process.env.PIPEDREAM_CLIENT_SECRET = 'test-client-secret';
    process.env.PIPEDREAM_PROJECT_ID = 'proj_test';
    process.env.PIPEDREAM_ENVIRONMENT = 'development';
    delete process.env.PIPEDREAM_APPS;
  });

  afterEach(() => {
    process.env.PIPEDREAM_CLIENT_ID = originalClientId;
    process.env.PIPEDREAM_CLIENT_SECRET = originalClientSecret;
    process.env.PIPEDREAM_PROJECT_ID = originalProjectId;
    process.env.PIPEDREAM_ENVIRONMENT = originalEnvironment;
    process.env.PIPEDREAM_APPS = originalApps;
  });

  it('enables runtime config with empty apps when project credentials are set', () => {
    const runtime = resolvePipedreamRuntimeConfig({ enabled: true });

    expect(runtime).toEqual({
      enabled: true,
      projectId: 'proj_test',
      environment: 'development',
      apps: [],
    });
  });

  it('returns null when project credentials are missing', () => {
    delete process.env.PIPEDREAM_PROJECT_ID;

    expect(resolvePipedreamRuntimeConfig({ enabled: true })).toBeNull();
  });

  it('builds runtime config from yaml apps', () => {
    const runtime = resolvePipedreamRuntimeConfig({
      enabled: true,
      apps: [{ slug: 'facebook', name: 'Facebook' }],
    });

    expect(runtime).toEqual({
      enabled: true,
      projectId: 'proj_test',
      environment: 'development',
      apps: [{ slug: 'facebook', name: 'Facebook' }],
    });
  });

  it('merges pipedream MCP servers without overriding explicit entries', () => {
    const merged = mergePipedreamMcpServers(
      {
        'pipedream-facebook': {
          type: 'streamable-http',
          url: 'https://example.com/custom',
        },
      },
      {
        apps: [{ slug: 'facebook', name: 'Facebook' }],
      },
    );

    expect(merged?.['pipedream-facebook']?.url).toBe('https://example.com/custom');
  });

  it('adds pipedream MCP hosts to allowed domains', () => {
    const settings = mergePipedreamMcpSettings(
      { allowedDomains: ['example.com'] },
      { apps: [{ slug: 'slack', name: 'Slack' }] },
    );

    expect(settings?.allowedDomains).toEqual(
      expect.arrayContaining(['example.com', 'remote.mcp.pipedream.net']),
    );
  });

  it('creates per-app MCP server config with user placeholder', () => {
    const config = buildPipedreamMcpServerConfig({ slug: 'facebook', name: 'Facebook' });

    expect(getPipedreamServerName('facebook')).toBe('pipedream-facebook');
    expect(config.headers?.['x-pd-app-slug']).toBe('facebook');
    expect(config.headers?.['x-pd-external-user-id']).toBe(
      '{{LIBRECHAT_USER_TENANTID}}:{{LIBRECHAT_USER_ID}}',
    );
    expect(config.startup).toBe(false);
  });

  it('extracts connect URLs from tool output text', () => {
    const url = extractPipedreamConnectUrl(
      'Please connect your account: https://pipedream.com/_static/connect.html?token=ctok_abc&connectLink=true&app=facebook',
    );

    expect(url).toBe(
      'https://pipedream.com/_static/connect.html?token=ctok_abc&connectLink=true&app=facebook',
    );
  });
});
