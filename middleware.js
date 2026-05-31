/**
 * Proxies API, OAuth, health, and image routes to a separately hosted LibreChat backend.
 * Set LIBRECHAT_API_URL to the backend origin (e.g. https://librechat-api.example.com).
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

export default async function middleware(request) {
  const apiUrl = process.env.LIBRECHAT_API_URL;

  if (!apiUrl) {
    return new Response(
      JSON.stringify({
        error:
          'LIBRECHAT_API_URL is not configured. Host the LibreChat API (Docker, Railway, etc.) and set this variable to that origin.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const requestUrl = new URL(request.url);
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
    init.body = request.body;
    init.duplex = 'half';
  }

  return fetch(targetUrl, init);
}
