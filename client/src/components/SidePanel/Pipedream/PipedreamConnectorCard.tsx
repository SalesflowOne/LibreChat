import { useMemo } from 'react';
import { ExternalLink, PlugZap } from 'lucide-react';
import { Button, Spinner } from '@librechat/client';
import type { PipedreamAccount, PipedreamApp } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { useCreatePipedreamConnectTokenMutation } from '~/data-provider/Pipedream';

interface PipedreamConnectorCardProps {
  app: PipedreamApp;
  accounts: PipedreamAccount[];
  isConnecting: boolean;
  connectingAppSlug: string | null;
  onConnectStart: (appSlug: string) => void;
}

export default function PipedreamConnectorCard({
  app,
  accounts,
  isConnecting,
  connectingAppSlug,
  onConnectStart,
}: PipedreamConnectorCardProps) {
  const localize = useLocalize();
  const connectMutation = useCreatePipedreamConnectTokenMutation();

  const connectedAccounts = useMemo(
    () => accounts.filter((account) => account.appSlug === app.slug && !account.dead),
    [accounts, app.slug],
  );

  const isConnected = connectedAccounts.length > 0;
  const isBusy = isConnecting || (connectMutation.isPending && connectingAppSlug === app.slug);

  const handleConnect = async () => {
    onConnectStart(app.slug);
    try {
      const { connectUrl } = await connectMutation.mutateAsync({ appSlug: app.slug });
      window.open(connectUrl, '_blank', 'noopener,noreferrer');
    } catch {
      onConnectStart('');
    }
  };

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border-medium bg-surface-primary p-3"
      role="listitem"
      aria-label={app.name}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-secondary">
        {app.iconUrl ? (
          <img src={app.iconUrl} alt="" className="h-8 w-8 object-contain" />
        ) : (
          <PlugZap className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-primary">{app.name}</div>
        <div className="text-xs text-text-secondary">
          {isConnected
            ? localize('com_ui_pipedream_connected_count', {
                0: String(connectedAccounts.length),
              })
            : localize('com_ui_pipedream_not_connected')}
        </div>
      </div>

      <Button
        type="button"
        variant={isConnected ? 'outline' : 'default'}
        size="sm"
        onClick={handleConnect}
        disabled={isBusy}
        aria-label={
          isConnected
            ? localize('com_ui_pipedream_manage_connection', { 0: app.name })
            : localize('com_ui_pipedream_connect_app', { 0: app.name })
        }
      >
        {isBusy ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <>
            <ExternalLink className="mr-1 h-4 w-4" aria-hidden="true" />
            {isConnected
              ? localize('com_ui_pipedream_reconnect')
              : localize('com_ui_pipedream_connect')}
          </>
        )}
      </Button>
    </div>
  );
}
