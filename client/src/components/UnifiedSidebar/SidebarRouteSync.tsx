import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { useActivePanel } from '~/Providers';
import store from '~/store';

const AGENT_OPS_FULL_PAGE_PATTERN = /^\/(home|connectors|artifacts|spaces)(\/|$)/;

function isAgentOpsFullPage(pathname: string): boolean {
  return AGENT_OPS_FULL_PAGE_PATTERN.test(pathname);
}

function resolvePanelFromPath(pathname: string): string | null {
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

export default function SidebarRouteSync() {
  const { pathname } = useLocation();
  const { setActive } = useActivePanel();
  const [expanded, setExpanded] = useRecoilState(store.sidebarExpanded);

  useEffect(() => {
    const panel = resolvePanelFromPath(pathname);
    if (panel) {
      setActive(panel);
    }

    if (isAgentOpsFullPage(pathname) && expanded) {
      setExpanded(false);
    }
  }, [pathname, expanded, setActive, setExpanded]);

  return null;
}
