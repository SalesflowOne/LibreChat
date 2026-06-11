import { useLocation } from 'react-router-dom';
import type { NavLink } from '~/common';
import { useActivePanel, resolveActivePanel } from '~/Providers';
import { isAgentOpsFullPageRoute } from '~/utils/agentOpsRoutes';

export default function Nav({ links }: { links: NavLink[] }) {
  const { pathname } = useLocation();
  const { active } = useActivePanel();
  const effectiveActive = resolveActivePanel(active, links);

  if (isAgentOpsFullPageRoute(pathname)) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto overflow-x-hidden text-text-primary">
      {links.map((link) =>
        link.id === effectiveActive && link.Component ? <link.Component key={link.id} /> : null,
      )}
    </div>
  );
}
