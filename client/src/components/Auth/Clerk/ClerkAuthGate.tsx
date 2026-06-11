import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth, useOrganization } from '@clerk/react';
import { Button, Spinner } from '@librechat/client';
import { useRecoilValue } from 'recoil';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import store from '~/store';

const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
];

function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function AuthStatusScreen({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border-light bg-surface-primary p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
        <p className="text-sm text-text-secondary">{description}</p>
        {action}
      </div>
    </div>
  );
}

export default function ClerkAuthGate({ children }: { children: ReactNode }) {
  const localize = useLocalize();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const bridgeState = useRecoilValue(store.clerkBridgeState);
  const bridgeError = useRecoilValue(store.clerkBridgeError);
  const { isLoaded, isSignedIn } = useAuth();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  if (!isClerkEnabled() || isPublicAuthRoute(location.pathname)) {
    return children;
  }

  if (!isLoaded || !isOrgLoaded || bridgeState === 'loading') {
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_loading_title')}
        description={localize('com_ui_clerk_loading_desc')}
        action={<Spinner className="mx-auto h-8 w-8" />}
      />
    );
  }

  if (!isSignedIn) {
    return children;
  }

  if (!organization?.id || bridgeState === 'needs_org') {
    const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL as string | undefined;
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_org_required_title')}
        description={localize('com_ui_clerk_org_required_desc')}
        action={
          signInUrl ? (
            <Button type="button" onClick={() => window.location.assign(signInUrl)}>
              {localize('com_ui_clerk_open_workspace')}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (bridgeState === 'error') {
    const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL as string | undefined;
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_exchange_failed_title')}
        description={bridgeError ?? localize('com_ui_clerk_exchange_failed_desc')}
        action={
          signInUrl ? (
            <Button type="button" variant="outline" onClick={() => window.location.assign(signInUrl)}>
              {localize('com_ui_clerk_try_again')}
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              {localize('com_ui_refresh_page')}
            </Button>
          )
        }
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_loading_title')}
        description={localize('com_ui_clerk_loading_desc')}
        action={<Spinner className="mx-auto h-8 w-8" />}
      />
    );
  }

  return children;
}
