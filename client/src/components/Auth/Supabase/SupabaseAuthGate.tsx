import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Button, Spinner } from '@librechat/client';
import { useRecoilValue } from 'recoil';
import { buildLoginRedirectUrl } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';
import { isSupabaseAuthEnabled } from '~/lib/auth';
import store from '~/store';

const PUBLIC_ROUTE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
];

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

function SupabaseAuthGateInner({ children }: { children: ReactNode }) {
  const localize = useLocalize();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();
  const bridgeState = useRecoilValue(store.authBridgeState);
  const bridgeError = useRecoilValue(store.authBridgeError);
  const [authStalled, setAuthStalled] = useState(false);
  const stallStartedRef = useRef(false);
  const isPublicRoute = isPublicAuthRoute(location.pathname);

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

  if (!isAuthenticated && bridgeState !== 'ready') {
    if (authStalled && bridgeState !== 'error') {
      return <Navigate to={buildLoginRedirectUrl(location.pathname, location.search, location.hash)} replace />;
    }

    if (bridgeState === 'error') {
      return (
        <AuthStatusScreen
          title={localize('com_ui_auth_exchange_failed_title')}
          description={bridgeError ?? localize('com_ui_auth_exchange_failed_desc')}
          action={
            <div className="flex flex-col gap-2">
              <Button type="button" variant="outline" onClick={() => window.location.reload()}>
                {localize('com_ui_refresh_page')}
              </Button>
              <Button
                type="button"
                onClick={() =>
                  window.location.assign(
                    buildLoginRedirectUrl(location.pathname, location.search, location.hash),
                  )
                }
              >
                {localize('com_ui_auth_back_to_login')}
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <AuthStatusScreen
        title={localize('com_ui_auth_loading_title')}
        description={localize('com_ui_auth_loading_desc')}
        action={<Spinner className="mx-auto h-8 w-8" />}
      />
    );
  }

  return children;
}

export default function SupabaseAuthGate({ children }: { children: ReactNode }) {
  if (!isSupabaseAuthEnabled()) {
    return children;
  }

  return <SupabaseAuthGateInner>{children}</SupabaseAuthGateInner>;
}
