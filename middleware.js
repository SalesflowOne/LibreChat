import proxyConfig from './proxy.config.json';

/**
 * Proxies API, OAuth, health, and image routes to a separately hosted LibreChat backend.
 * Set LIBRECHAT_API_URL in Vercel project settings (baked into proxy.config.json at build).
 *
 * Designed to be transparent to Server-Sent Events (SSE) chat streaming: the upstream body
 * is piped through untouched and length/encoding headers that would break a re-streamed body
 * are removed so Vercel never buffers the response.
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

/** Methods that are safe to retry once on a transient upstream/network failure. */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD']);

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

/** Reflects the caller's origin so credentialed (cookie-based) requests pass CORS. */
function applyCorsHeaders(headers, origin) {
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    const vary = headers.get('Vary');
    headers.set('Vary', vary ? `${vary}, Origin` : 'Origin');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
}

function jsonResponse(body, status, origin) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  applyCorsHeaders(headers, origin);
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Rebuilds the upstream response so the body streams through Vercel without buffering.
 * Strips `content-length`/`content-encoding` (the body is already decoded and may be
 * chunked), preserves every `Set-Cookie` individually, and layers CORS headers on top.
 */
function buildProxiedResponse(upstream, origin) {
  const headers = new Headers(upstream.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    headers.delete('set-cookie');
    for (const cookie of setCookies) {
      headers.append('set-cookie', cookie);
    }
  }

  applyCorsHeaders(headers, origin);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

function buildForwardInit(request) {
  const headers = new Headers(request.headers);
  const requestUrl = new URL(request.url);
  headers.set('x-forwarded-host', requestUrl.host);
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(':', ''));
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  return init;
}

export default async function middleware(request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    const headers = new Headers({
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers':
        request.headers.get('access-control-request-headers') || 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    applyCorsHeaders(headers, origin);
    return new Response(null, { status: 204, headers });
  }

  const apiUrl = resolveApiUrl();

  if (!apiUrl) {
    if (isConfigRequest(requestUrl.pathname)) {
      return jsonResponse(preLoginConfigFallback(requestUrl), 200, origin);
    }

    return jsonResponse(
      {
        error: 'Backend not configured',
        message:
          'LIBRECHAT_API_URL is not set. Host the LibreChat API (Docker, Coolify, Railway, etc.) ' +
          'and set this variable in your Vercel project settings to that origin, then redeploy.',
      },
      503,
      origin,
    );
  }

  const targetUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, apiUrl);
  const canRetry = RETRYABLE_METHODS.has(request.method);

  let lastError;
  for (let attempt = 0; attempt <= (canRetry ? 1 : 0); attempt++) {
    try {
      const upstream = await fetch(targetUrl, buildForwardInit(request));

      if (!upstream.ok && isConfigRequest(requestUrl.pathname) && request.method === 'GET') {
        return jsonResponse(preLoginConfigFallback(requestUrl), 200, origin);
      }

      return buildProxiedResponse(upstream, origin);
    } catch (error) {
      lastError = error;
    }
  }

  if (isConfigRequest(requestUrl.pathname) && request.method === 'GET') {
    return jsonResponse(preLoginConfigFallback(requestUrl), 200, origin);
  }

  return jsonResponse(
    {
      error: 'Backend unreachable',
      message:
        'The LibreChat API could not be reached. This is usually a transient backend issue — ' +
        'please retry in a moment. If it persists, verify the backend deployment is running.',
      detail: lastError instanceof Error ? lastError.message : 'Unknown network error',
    },
    502,
    origin,
  );
}
