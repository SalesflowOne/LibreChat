import { useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { dataService, setTokenHeader } from 'librechat-data-provider';
import { getAccessToken, isSupabaseAuthEnabled, onAuthStateChange } from '~/lib/auth';
import store from '~/store';

type ExchangePhase = 'idle' | 'pending' | 'done' | 'error';

const EXCHANGE_TIMEOUT_MS = 20_000;

export function useSupabaseAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  const setQueriesEnabled = useSetRecoilState(store.queriesEnabled);
  const setBridgeState = useSetRecoilState(store.authBridgeState);
  const setBridgeError = useSetRecoilState(store.authBridgeError);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onSignedOutRef = useRef(onSignedOut);
  const exchangePhaseRef = useRef<ExchangePhase>('idle');

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
    onSignedOutRef.current = onSignedOut;
  }, [onAuthenticated, onSignedOut]);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      setBridgeState('idle');
      setBridgeError(null);
      return;
    }

    const runExchange = async () => {
      if (exchangePhaseRef.current === 'pending' || exchangePhaseRef.current === 'done') {
        return;
      }

      exchangePhaseRef.current = 'pending';
      setBridgeState('loading');
      setBridgeError(null);

      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          exchangePhaseRef.current = 'idle';
          setBridgeState('idle');
          return;
        }

        const result = await dataService.exchangeSupabaseSession(accessToken);
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
        setBridgeError('Could not connect to the workspace API. Please try signing in again.');
      }
    };

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled || exchangePhaseRef.current !== 'pending') {
        return;
      }
      exchangePhaseRef.current = 'error';
      setBridgeState('error');
      setBridgeError('Timed out connecting to the workspace API.');
    }, EXCHANGE_TIMEOUT_MS);

    void runExchange().finally(() => {
      window.clearTimeout(timeout);
    });

    const { unsubscribe } = onAuthStateChange((session) => {
      if (!session) {
        setTokenHeader(undefined);
        setQueriesEnabled(false);
        exchangePhaseRef.current = 'idle';
        setBridgeState('idle');
        setBridgeError(null);
        onSignedOutRef.current();
        return;
      }

      if (exchangePhaseRef.current === 'done') {
        return;
      }

      exchangePhaseRef.current = 'idle';
      void runExchange();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [setBridgeError, setBridgeState, setQueriesEnabled]);
}
