import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ExternalLink, Pencil, PlugZap, Plus, Users } from 'lucide-react';
import {
  Button,
  FilterInput,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@librechat/client';
import { useLocalize, useAuthContext } from '~/hooks';
import {
  useCreatePipedreamConnectTokenMutation,
  usePipedreamAccountsQuery,
  usePipedreamStatusQuery,
} from '~/data-provider/Pipedream';
import AgentOpsPage from '~/components/AgentOps/Page';
import { getActiveAccountsForApp } from './utils';

export default function IntegrationDetail() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const { appSlug: rawAppSlug } = useParams<{ appSlug: string }>();
  const appSlug = rawAppSlug ? decodeURIComponent(rawAppSlug) : '';
  const [searchQuery, setSearchQuery] = useState('');
  const [connecting, setConnecting] = useState(false);

  const connectMutation = useCreatePipedreamConnectTokenMutation();
  const { data: status, isLoading: isStatusLoading } = usePipedreamStatusQuery();
  const { data: accountsData, isLoading: isAccountsLoading } = usePipedreamAccountsQuery(
    Boolean(status?.enabled),
  );

  const app = useMemo(
    () => status?.apps.find((entry) => entry.slug === appSlug),
    [status?.apps, appSlug],
  );

  const accounts = accountsData?.accounts ?? [];
  const connectedAccounts = useMemo(
    () => getActiveAccountsForApp(accounts, appSlug),
    [accounts, appSlug],
  );

  const filteredAccounts = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) {
      return connectedAccounts;
    }

    return connectedAccounts.filter((account) => {
      const label = (account.name ?? account.appName).toLowerCase();
      return label.includes(normalized);
    });
  }, [connectedAccounts, searchQuery]);

  const handleConnect = async () => {
    if (!appSlug) {
      return;
    }

    setConnecting(true);
    try {
      const { connectUrl } = await connectMutation.mutateAsync({ appSlug });
      window.open(connectUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setConnecting(false);
    }
  };

  const isLoading = isStatusLoading || (status?.enabled && isAccountsLoading);
  const isBusy = connecting || connectMutation.isLoading;
  const addedByName = user?.name || user?.username || localize('com_ui_integrations_you');
  const addedByInitial = addedByName.charAt(0).toUpperCase();

  if (isLoading) {
    return (
      <div className="flex h-full justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!status?.enabled || !app) {
    return (
      <AgentOpsPage>
        <nav className="flex items-center gap-1 text-sm text-text-secondary" aria-label="Breadcrumb">
          <Link to="/connectors" className="hover:text-text-primary">
            {localize('com_ui_integrations_breadcrumb')}
          </Link>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="text-text-primary">{appSlug}</span>
        </nav>
        <div className="rounded-2xl border border-border-light bg-surface-primary p-8 text-center">
          <p className="text-sm text-text-secondary">
            {localize('com_ui_integrations_app_not_found')}
          </p>
          <Button asChild type="button" variant="outline" className="mt-4">
            <Link to="/connectors">{localize('com_ui_integrations_back_to_hub')}</Link>
          </Button>
        </div>
      </AgentOpsPage>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto p-6">
      <nav className="flex items-center gap-1 text-sm text-text-secondary" aria-label="Breadcrumb">
        <Link to="/connectors" className="hover:text-text-primary">
          {localize('com_ui_integrations_breadcrumb')}
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="text-text-primary">{app.name}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-surface-secondary">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt="" className="h-10 w-10 object-contain" />
            ) : (
              <PlugZap className="h-6 w-6 text-text-secondary" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-text-primary">{app.name}</h1>
            <p className="max-w-2xl text-sm text-text-secondary">
              {app.description || localize('com_ui_integrations_default_app_desc', { 0: app.name })}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={handleConnect}
          disabled={isBusy}
        >
          {isBusy ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              {localize('com_ui_integrations_add_account')}
            </>
          )}
        </Button>
      </div>

      <FilterInput
        inputId="integration-accounts-search"
        label={localize('com_ui_integrations_search_accounts')}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />

      <p className="text-sm text-text-secondary">
        {localize(
          connectedAccounts.length === 1
            ? 'com_ui_integrations_accounts_connected_one'
            : 'com_ui_integrations_accounts_connected_other',
          { 0: String(connectedAccounts.length) },
        )}
      </p>

      {filteredAccounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light p-8 text-center text-sm text-text-secondary">
          {connectedAccounts.length === 0
            ? localize('com_ui_integrations_no_accounts')
            : localize('com_ui_integrations_no_results')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-light">
          <Table unwrapped>
            <TableHeader>
              <TableRow>
                <TableHead>{localize('com_ui_integrations_col_account')}</TableHead>
                <TableHead>{localize('com_ui_integrations_col_access')}</TableHead>
                <TableHead>{localize('com_ui_integrations_col_added_by')}</TableHead>
                <TableHead className="text-right">
                  {localize('com_ui_integrations_col_actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          account.healthy ? 'bg-green-500' : 'bg-amber-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="font-medium text-text-primary">
                        {account.name ?? account.appName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Users className="h-4 w-4" aria-hidden="true" />
                      {localize('com_ui_integrations_team_only')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-text-primary">
                          {addedByInitial}
                        </span>
                      )}
                      <span className="text-text-primary">{addedByName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleConnect}
                      disabled={isBusy}
                      aria-label={localize('com_ui_integrations_edit_account', {
                        0: account.name ?? account.appName,
                      })}
                    >
                      <Pencil className="mr-1 h-4 w-4" aria-hidden="true" />
                      {localize('com_ui_integrations_edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {connectedAccounts.length === 0 && (
        <div className="rounded-2xl border border-border-light bg-surface-secondary p-6">
          <p className="text-sm text-text-secondary">
            {localize('com_ui_integrations_connect_prompt', { 0: app.name })}
          </p>
          <Button type="button" className="mt-4" onClick={handleConnect} disabled={isBusy}>
            {isBusy ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                {localize('com_ui_pipedream_connect')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
