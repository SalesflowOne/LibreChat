import { useEffect, useRef } from 'react';
import { useAuth, useOrganization } from '@clerk/react';
import { dataService, setTokenHeader } from 'librechat-data-provider';
import { useSetRecoilState } from 'recoil';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import store from '~/store';

export function useClerkAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { organization } = useOrganization();
  const setQueriesEnabled = useSetRecoilState(store.queriesEnabled);
  const exchangingRef = useRef(false);

  useEffect(() => {
    if (!isClerkEnabled() || !isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setTokenHeader(undefined);
      setQueriesEnabled(false);
      onSignedOut();
      return;
    }

    if (!organization?.id) {
      return;
    }

    if (exchangingRef.current) {
      return;
    }

    exchangingRef.current = true;
    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          return;
        }
        const result = await dataService.exchangeClerkSession(clerkToken);
        setTokenHeader(result.token);
        setQueriesEnabled(true);
        onAuthenticated(result.token, result.user as Record<string, unknown>);
      } catch {
        await signOut();
        onSignedOut();
      } finally {
        exchangingRef.current = false;
      }
    })();
  }, [
    isLoaded,
    isSignedIn,
    organization?.id,
    getToken,
    signOut,
    onAuthenticated,
    onSignedOut,
    setQueriesEnabled,
  ]);
}
