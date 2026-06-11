const AGENT_OPS_FULL_PAGE_PATTERN = /^\/(home|connectors|artifacts|spaces)(\/|$)/;

export function isAgentOpsFullPageRoute(pathname: string): boolean {
  return AGENT_OPS_FULL_PAGE_PATTERN.test(pathname);
}

export function resolveAgentOpsPanelFromPath(pathname: string): string | null {
  if (pathname === '/home' || pathname === '/') {
    return 'command-center';
  }
  if (pathname.startsWith('/connectors')) {
    return 'connector-hub';
  }
  if (pathname.startsWith('/artifacts')) {
    return 'artifacts-gallery';
  }
  if (pathname.startsWith('/spaces')) {
    return 'spaces';
  }
  if (pathname.startsWith('/c/') || pathname === '/c') {
    return 'conversations';
  }
  return null;
}
