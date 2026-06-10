jest.mock('@librechat/data-schemas', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

import { PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER } from './constants';
import {
  clearPipedreamTokenCache,
  getPipedreamAccessToken,
  preProcessPipedreamTokens,
} from './tokens';

describe('Pipedream tokens', () => {
  const originalFetch = global.fetch;
  const originalClientId = process.env.PIPEDREAM_CLIENT_ID;
  const originalClientSecret = process.env.PIPEDREAM_CLIENT_SECRET;

  beforeEach(() => {
    clearPipedreamTokenCache();
    process.env.PIPEDREAM_CLIENT_ID = 'test-client-id';
    process.env.PIPEDREAM_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearPipedreamTokenCache();
    process.env.PIPEDREAM_CLIENT_ID = originalClientId;
    process.env.PIPEDREAM_CLIENT_SECRET = originalClientSecret;
  });

  it('fetches and caches a developer access token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'pd-token-1', expires_in: 3600 }),
    }) as typeof fetch;

    const first = await getPipedreamAccessToken();
    const second = await getPipedreamAccessToken();

    expect(first).toBe('pd-token-1');
    expect(second).toBe('pd-token-1');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('resolves pipedream placeholders in MCP headers', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'pd-token-2', expires_in: 3600 }),
    }) as typeof fetch;

    const result = await preProcessPipedreamTokens({
      headers: {
        Authorization: `Bearer ${PIPEDREAM_ACCESS_TOKEN_PLACEHOLDER}`,
      },
    });

    expect(result.headers?.Authorization).toBe('Bearer pd-token-2');
  });
});
