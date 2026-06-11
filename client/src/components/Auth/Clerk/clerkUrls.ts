export function getClerkReturnUrl(pathname: string, search: string, hash: string): string {
  return `${window.location.origin}${pathname}${search}${hash}`;
}

export function isClerkSyncReturn(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.has('__clerk_synced') || params.has('__clerk_sync') || params.has('__clerk_status');
}

export function buildSatelliteSignInUrl(
  buildSignInUrl: (options?: { redirectUrl?: string }) => string,
  returnUrl: string,
): string {
  return buildSignInUrl({ redirectUrl: returnUrl });
}
