import { useEffect, useRef } from 'react';
import { useAuth, useOrganization } from '@clerk/react';
import { useSetRecoilState } from 'recoil';
import { dataService, setTokenHeader } from 'librechat-data-provider';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import store from '~/store';

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
  const exchangingRef = useRef(false);

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
      setTokenHeader(undefined);
      setQueriesEnabled(false);
      setBridgeState('idle');
      setBridgeError(null);
      onSignedOut();
      return;
    }

    if (!organization?.id) {
      setBridgeState('needs_org');
      setBridgeError(null);
      return;
    }

    if (exchangingRef.current) {
      return;
    }

    exchangingRef.current = true;
    setBridgeState('loading');
    setBridgeError(null);

    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          setBridgeState('error');
          setBridgeError('Could not read your Clerk session. Try signing in again.');
          return;
        }

        const result = await dataService.exchangeClerkSession(clerkToken);
        setTokenHeader(result.token);
        setQueriesEnabled(true);
        setBridgeState('ready');
        setBridgeError(null);
        onAuthenticated(result.token, result.user as Record<string, unknown>);
      } catch {
        setTokenHeader(undefined);
        setQueriesEnabled(false);
        setBridgeState('error');
        setBridgeError(
          'Could not connect to the workspace API. The backend may still be deploying AgentOps routes.',
        );
        onSignedOut();
      } finally {
        exchangingRef.current = false;
      }
    })();
  }, [
    isLoaded,
    isOrgLoaded,
    isSignedIn,
    organization?.id,
    getToken,
    onAuthenticated,
    onSignedOut,
    setQueriesEnabled,
    setBridgeState,
    setBridgeError,
  ]);
}
