import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as auth from '~/lib/auth';
import type { AuthProfile, SignUpProfileData } from '~/lib/auth.types';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(auth.isSupabaseAuthEnabled());

  useEffect(() => {
    if (!auth.isSupabaseAuthEnabled()) {
      setIsLoading(false);
      return;
    }

    let active = true;

    void auth.getSession().then((nextSession) => {
      if (!active) {
        return;
      }
      setSession(nextSession);
      setIsLoading(false);
    });

    const { unsubscribe } = auth.onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const nextProfile = await auth.getProfile();
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }

    void refreshProfile();
  }, [session, refreshProfile]);

  return {
    session,
    profile,
    isLoading,
    isAuthenticated: Boolean(session),
    signIn: auth.signIn,
    signUp: (email: string, password: string, profileData?: SignUpProfileData) =>
      auth.signUp(email, password, profileData),
    signOut: auth.signOut,
    resetPassword: auth.resetPassword,
    updatePassword: auth.updatePassword,
    updateProfile: auth.updateProfile,
    refreshProfile,
    hasRole: auth.hasRole,
    hasAppAccess: auth.hasAppAccess,
    getAccessToken: auth.getAccessToken,
    requireAuth: auth.requireAuth,
    getSession: auth.getSession,
    getCurrentUser: auth.getCurrentUser,
  };
}
