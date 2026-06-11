import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { useActivePanel } from '~/Providers';
import { isAgentOpsFullPageRoute, resolveAgentOpsPanelFromPath } from '~/utils/agentOpsRoutes';
import store from '~/store';

export default function SidebarRouteSync() {
  const { pathname } = useLocation();
  const { setActive } = useActivePanel();
  const [expanded, setExpanded] = useRecoilState(store.sidebarExpanded);

  useEffect(() => {
    const panel = resolveAgentOpsPanelFromPath(pathname);
    if (panel) {
      setActive(panel);
    }

    if (isAgentOpsFullPageRoute(pathname) && expanded) {
      setExpanded(false);
    }
  }, [pathname, expanded, setActive, setExpanded]);

  return null;
}
