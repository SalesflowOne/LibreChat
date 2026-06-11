import proxyConfig from './proxy.config.json';

/**
 * Proxies API, OAuth, health, and image routes to a separately hosted LibreChat backend.
 * Set LIBRECHAT_API_URL in Vercel project settings (baked into proxy.config.json at build).
 */
export const config = {
  matcher: [
    '/api/:path*',
    '/oauth/:path*',
    '/health',
    '/livez',
    '/readyz',
    '/images/:path*',
  ],
};

function resolveApiUrl() {
  const runtime = process.env.LIBRECHAT_API_URL?.trim();
  if (runtime) {
    return runtime;
  }
  return proxyConfig.apiUrl?.trim() ?? '';
}

function preLoginConfigFallback(requestUrl) {
  const origin = `${requestUrl.protocol}//${requestUrl.host}`;
  return {
    appTitle: 'LibreChat',
    serverDomain: origin,
    emailLoginEnabled: true,
    registrationEnabled: true,
    socialLoginEnabled: false,
    emailEnabled: false,
    passwordResetEnabled: false,
    openidLoginEnabled: false,
    openidAutoRedirect: false,
    samlLoginEnabled: false,
    ldapEnabled: false,
    discordLoginEnabled: false,
    facebookLoginEnabled: false,
    githubLoginEnabled: false,
    googleLoginEnabled: false,
    appleLoginEnabled: false,
    sharePointFilePickerEnabled: false,
    sharedLinksEnabled: false,
    publicSharedLinksEnabled: false,
    turnstile: null,
    minPasswordLength: 8,
  };
}

function isConfigRequest(pathname) {
  return pathname === '/api/config' || pathname === '/api/config/';
}

export default async function middleware(request) {
  const requestUrl = new URL(request.url);
  const apiUrl = resolveApiUrl();

  if (!apiUrl) {
    if (isConfigRequest(requestUrl.pathname)) {
      return Response.json(preLoginConfigFallback(requestUrl), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        error:
          'LIBRECHAT_API_URL is not configured. Host the LibreChat API (Docker, Railway, etc.) and set this variable to that origin, then redeploy.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const targetUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, apiUrl);

  const headers = new Headers(request.headers);
  headers.set('x-forwarded-host', requestUrl.host);
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''));
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    const upstream = await fetch(targetUrl, init);

    if (!upstream.ok && isConfigRequest(requestUrl.pathname) && request.method === 'GET') {
      return Response.json(preLoginConfigFallback(requestUrl), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('connection');
    responseHeaders.delete('keep-alive');
    responseHeaders.delete('transfer-encoding');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    if (isConfigRequest(requestUrl.pathname) && request.method === 'GET') {
      return Response.json(preLoginConfigFallback(requestUrl), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        error: 'LibreChat API is unreachable. Check LIBRECHAT_API_URL and your backend deployment.',
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
