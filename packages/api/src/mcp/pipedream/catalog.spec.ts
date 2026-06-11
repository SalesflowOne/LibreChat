jest.mock('@librechat/data-schemas', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('./client', () => ({
  listPipedreamCatalogApps: jest.fn(),
}));

import { listPipedreamCatalogApps } from './client';
import { resolvePipedreamApps } from './catalog';
import type { PipedreamRuntimeConfig } from './config';

const mockedListPipedreamCatalogApps = listPipedreamCatalogApps as jest.MockedFunction<
  typeof listPipedreamCatalogApps
>;

describe('resolvePipedreamApps', () => {
  const runtime: PipedreamRuntimeConfig = {
    enabled: true,
    projectId: 'proj_test',
    environment: 'development',
    apps: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns configured apps without calling the catalog API', async () => {
    const configuredRuntime: PipedreamRuntimeConfig = {
      ...runtime,
      apps: [
        { slug: 'slack', name: 'Slack' },
        { slug: 'gmail', name: 'Gmail' },
      ],
    };

    const apps = await resolvePipedreamApps(configuredRuntime, { q: 'mail' });

    expect(mockedListPipedreamCatalogApps).not.toHaveBeenCalled();
    expect(apps).toEqual([{ slug: 'gmail', name: 'Gmail' }]);
  });

  it('fetches apps from the Pipedream catalog when no static apps are configured', async () => {
    mockedListPipedreamCatalogApps.mockResolvedValue({
      apps: [{ slug: 'slack', name: 'Slack' }],
      nextCursor: null,
    });

    const apps = await resolvePipedreamApps(runtime, { q: 'slack', limit: 25 });

    expect(mockedListPipedreamCatalogApps).toHaveBeenCalledWith({
      environment: 'development',
      q: 'slack',
      limit: 25,
    });
    expect(apps).toEqual([{ slug: 'slack', name: 'Slack' }]);
  });
});
