import { useEffect, useRef } from 'react';
import { useAuth, useOrganization } from '@clerk/react';
import { useSetRecoilState } from 'recoil';
import { dataService, setTokenHeader } from 'librechat-data-provider';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import store from '~/store';

type ExchangePhase = 'idle' | 'pending' | 'done' | 'error';

export function useClerkAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
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

    if (!isLoaded || !isOrgLoaded) {
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

    if (!organization?.id) {
      setBridgeState('needs_org');
      setBridgeError(null);
      return;
    }

    if (lastOrgIdRef.current !== organization.id) {
      exchangePhaseRef.current = 'idle';
      lastOrgIdRef.current = organization.id;
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

    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          exchangePhaseRef.current = 'error';
          setBridgeState('error');
          setBridgeError('Could not read your Clerk session. Try signing in again.');
          return;
        }

        const result = await dataService.exchangeClerkSession(clerkToken);
        setTokenHeader(result.token);
        setQueriesEnabled(true);
        exchangePhaseRef.current = 'done';
        setBridgeState('ready');
        setBridgeError(null);
        onAuthenticatedRef.current(result.token, result.user as Record<string, unknown>);
      } catch {
        setTokenHeader(undefined);
        setQueriesEnabled(false);
        exchangePhaseRef.current = 'error';
        setBridgeState('error');
        setBridgeError(
          'Could not connect to the workspace API. The backend may still be deploying AgentOps routes.',
        );
      }
    })();
  }, [
    isLoaded,
    isOrgLoaded,
    isSignedIn,
    organization?.id,
    setQueriesEnabled,
    setBridgeState,
    setBridgeError,
  ]);
}
