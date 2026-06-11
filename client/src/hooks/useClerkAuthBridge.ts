import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/react';
import { useSetRecoilState } from 'recoil';
import { dataService, setTokenHeader } from 'librechat-data-provider';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import store from '~/store';

type ExchangePhase = 'idle' | 'pending' | 'done' | 'error';

const EXCHANGE_TIMEOUT_MS = 20_000;

export function useClerkAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  const { isLoaded, isSignedIn, orgId, getToken } = useAuth();
  const setQueriesEnabled = useSetRecoilState(store.queriesEnabled);
  const setBridgeState = useSetRecoilState(store.clerkBridgeState);
  const setBridgeError = useSetRecoilState(store.clerkBridgeError);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onSignedOutRef = useRef(onSignedOut);
  const wasSignedInRef = useRef(false);
  const exchangePhaseRef = useRef<ExchangePhase>('idle');
  const lastOrgIdRef = useRef<string | null>(null);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
    onSignedOutRef.current = onSignedOut;
  }, [onAuthenticated, onSignedOut]);

  useEffect(() => {
    if (!isClerkEnabled()) {
      setBridgeState('idle');
      setBridgeError(null);
      return;
    }

    if (!isLoaded) {
      setBridgeState('loading');
      return;
    }

    if (!isSignedIn) {
      setBridgeState('idle');
      setBridgeError(null);
      if (wasSignedInRef.current) {
        setTokenHeader(undefined);
        setQueriesEnabled(false);
        exchangePhaseRef.current = 'idle';
        lastOrgIdRef.current = null;
        onSignedOutRef.current();
      }
      wasSignedInRef.current = false;
      return;
    }

    wasSignedInRef.current = true;

    if (!orgId) {
      setBridgeState('needs_org');
      setBridgeError(null);
      return;
    }

    if (lastOrgIdRef.current !== orgId) {
      exchangePhaseRef.current = 'idle';
      lastOrgIdRef.current = orgId;
    }

    if (exchangePhaseRef.current === 'pending' || exchangePhaseRef.current === 'done') {
      return;
    }

    if (exchangePhaseRef.current === 'error') {
      return;
    }

    exchangePhaseRef.current = 'pending';
    setBridgeState('loading');
    setBridgeError(null);

    let cancelled = false;

    void (async () => {
      const timeout = window.setTimeout(() => {
        if (cancelled || exchangePhaseRef.current !== 'pending') {
          return;
        }
        exchangePhaseRef.current = 'error';
        setBridgeState('error');
        setBridgeError(
          'Timed out connecting to the workspace API. The backend may still be deploying AgentOps routes.',
        );
      }, EXCHANGE_TIMEOUT_MS);

      try {
        const clerkToken = orgId ? await getToken({ organizationId: orgId }) : await getToken();
        if (cancelled) {
          return;
        }

        if (!clerkToken) {
          exchangePhaseRef.current = 'error';
          setBridgeState('error');
          setBridgeError('Could not read your Clerk session. Try signing in again.');
          return;
        }

        const result = await dataService.exchangeClerkSession(clerkToken);
        if (cancelled) {
          return;
        }

        setTokenHeader(result.token);
        setQueriesEnabled(true);
        exchangePhaseRef.current = 'done';
        setBridgeState('ready');
        setBridgeError(null);
        onAuthenticatedRef.current(result.token, result.user as Record<string, unknown>);
      } catch {
        if (cancelled) {
          return;
        }

        setTokenHeader(undefined);
        setQueriesEnabled(false);
        exchangePhaseRef.current = 'error';
        setBridgeState('error');
        setBridgeError(
          'Could not connect to the workspace API. The backend is still running the upstream LibreChat image without Clerk support.',
        );
      } finally {
        window.clearTimeout(timeout);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    orgId,
    getToken,
    setQueriesEnabled,
    setBridgeState,
    setBridgeError,
  ]);
}
