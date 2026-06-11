import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/react';
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

const SESSION_SYNC_GRACE_MS = 3000;
const AUTH_STALL_MS = 25_000;

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

function ClerkAuthGateInner({ children }: { children: ReactNode }) {
  const localize = useLocalize();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const bridgeState = useRecoilValue(store.clerkBridgeState);
  const bridgeError = useRecoilValue(store.clerkBridgeError);
  const { isLoaded, isSignedIn, orgId } = useAuth();
  const [sessionGraceElapsed, setSessionGraceElapsed] = useState(false);
  const [authStalled, setAuthStalled] = useState(false);
  const graceStartedRef = useRef(false);
  const stallStartedRef = useRef(false);
  const isPublicRoute = isPublicAuthRoute(location.pathname);

  useEffect(() => {
    if (!isLoaded || graceStartedRef.current) {
      return;
    }

    graceStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      setSessionGraceElapsed(true);
    }, SESSION_SYNC_GRACE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isLoaded]);

  useEffect(() => {
    if (isPublicRoute || isAuthenticated || bridgeState === 'error' || stallStartedRef.current) {
      return;
    }

    stallStartedRef.current = true;
    const timeout = window.setTimeout(() => {
      setAuthStalled(true);
    }, AUTH_STALL_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isPublicRoute, isAuthenticated, bridgeState]);

  if (isPublicRoute) {
    return children;
  }

  if (authStalled && bridgeState !== 'error' && !isAuthenticated) {
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_exchange_failed_title')}
        description={localize('com_ui_clerk_exchange_failed_desc')}
        action={
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            {localize('com_ui_refresh_page')}
          </Button>
        }
      />
    );
  }

  if (!isLoaded || bridgeState === 'loading') {
    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_loading_title')}
        description={localize('com_ui_clerk_loading_desc')}
        action={<Spinner className="mx-auto h-8 w-8" />}
      />
    );
  }

  if (!isSignedIn) {
    if (!sessionGraceElapsed) {
      return (
        <AuthStatusScreen
          title={localize('com_ui_clerk_loading_title')}
          description={localize('com_ui_clerk_syncing_desc')}
          action={<Spinner className="mx-auto h-8 w-8" />}
        />
      );
    }

    const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL as string | undefined;
    const returnUrl = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;

    return (
      <AuthStatusScreen
        title={localize('com_ui_clerk_sign_in_required_title')}
        description={localize('com_ui_clerk_sign_in_required_desc')}
        action={
          signInUrl ? (
            <Button
              type="button"
              onClick={() => {
                const target = new URL(signInUrl);
                target.searchParams.set('redirect_url', returnUrl);
                window.location.assign(target.toString());
              }}
            >
              {localize('com_ui_clerk_continue_sign_in')}
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (!orgId || bridgeState === 'needs_org') {
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
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              {localize('com_ui_refresh_page')}
            </Button>
            {signInUrl ? (
              <Button type="button" variant="ghost" onClick={() => window.location.assign(signInUrl)}>
                {localize('com_ui_clerk_try_again')}
              </Button>
            ) : null}
          </div>
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

export default function ClerkAuthGate({ children }: { children: ReactNode }) {
  if (!isClerkEnabled()) {
    return children;
  }

  return <ClerkAuthGateInner>{children}</ClerkAuthGateInner>;
}
