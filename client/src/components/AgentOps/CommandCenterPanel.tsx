import { Link, useLocation } from 'react-router-dom';
import { Boxes, LayoutDashboard, PlugZap, Rocket } from 'lucide-react';
import type { TranslationKeys } from '~/hooks';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

const NAV_ITEMS: Array<{
  to: string;
  icon: typeof LayoutDashboard;
  labelKey: TranslationKeys;
}> = [
  { to: '/home', icon: LayoutDashboard, labelKey: 'com_ui_agentops_command_center' },
  { to: '/connectors', icon: PlugZap, labelKey: 'com_ui_agentops_connectors' },
  { to: '/artifacts', icon: Boxes, labelKey: 'com_ui_agentops_artifacts' },
  { to: '/spaces', icon: Rocket, labelKey: 'com_ui_agentops_spaces' },
];

export default function CommandCenterPanel() {
  const localize = useLocalize();
  const { pathname } = useLocation();

  return (
    <nav
      className="flex flex-col gap-1 px-2 py-2"
      aria-label={localize('com_ui_agentops_command_center')}
    >
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => {
        const isActive = pathname === to || pathname.startsWith(`${to}/`);

        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
              isActive
                ? 'bg-surface-active-alt font-medium text-text-primary'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{localize(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
