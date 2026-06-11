import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';
import type { PipedreamAccount, PipedreamApp } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { getActiveAccountsForApp } from './utils';

interface IntegrationCardProps {
  app: PipedreamApp;
  accounts: PipedreamAccount[];
}

export default function IntegrationCard({ app, accounts }: IntegrationCardProps) {
  const localize = useLocalize();
  const connectedAccounts = getActiveAccountsForApp(accounts, app.slug);
  const connectedCount = connectedAccounts.length;

  return (
    <Link
      to={`/connectors/${encodeURIComponent(app.slug)}`}
      className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-primary p-4 transition-colors hover:border-border-medium hover:bg-surface-secondary"
      aria-label={app.name}
    >
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-surface-secondary">
        {app.iconUrl ? (
          <img src={app.iconUrl} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <PlugZap className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 space-y-1">
        <div className="truncate text-sm font-medium text-text-primary">{app.name}</div>
        {connectedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-green-500"
              aria-hidden="true"
            />
            <span>
              {localize(
                connectedCount === 1
                  ? 'com_ui_integrations_accounts_connected_one'
                  : 'com_ui_integrations_accounts_connected_other',
                { 0: String(connectedCount) },
              )}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
