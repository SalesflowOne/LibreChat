import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseAuthEnabled } from '~/lib/supabase';
import type { AppRole, AuthProfile, SignUpProfileData } from '~/lib/auth.types';

export { isSupabaseAuthEnabled };

export async function getSession(): Promise<Session | null> {
  const { data } = await getSupabaseClient().auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await getSupabaseClient().auth.getUser();
  return data.user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error('Sign in succeeded but no session was returned.');
  }

  return data.session;
}

export async function signUp(
  email: string,
  password: string,
  profileData?: SignUpProfileData,
): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: {
        first_name: profileData?.firstName?.trim() || undefined,
        last_name: profileData?.lastName?.trim() || undefined,
        display_name: profileData?.displayName?.trim() || undefined,
        phone: profileData?.phone?.trim() || undefined,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function resetPassword(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}

export async function getProfile(): Promise<AuthProfile | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('id, email, first_name, last_name, display_name, phone, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return {
      id: user.id,
      email: user.email ?? '',
      displayName: user.user_metadata?.display_name as string | undefined,
      firstName: user.user_metadata?.first_name as string | undefined,
      lastName: user.user_metadata?.last_name as string | undefined,
    };
  }

  return {
    id: data.id,
    email: data.email ?? user.email ?? '',
    firstName: data.first_name ?? undefined,
    lastName: data.last_name ?? undefined,
    displayName: data.display_name ?? undefined,
    phone: data.phone ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

export async function updateProfile(updates: Partial<AuthProfile>): Promise<AuthProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const payload = {
    id: user.id,
    email: updates.email?.trim().toLowerCase() ?? user.email,
    first_name: updates.firstName?.trim() || null,
    last_name: updates.lastName?.trim() || null,
    display_name: updates.displayName?.trim() || null,
    phone: updates.phone?.trim() || null,
    avatar_url: updates.avatarUrl?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id, email, first_name, last_name, display_name, phone, avatar_url')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    email: data.email ?? '',
    firstName: data.first_name ?? undefined,
    lastName: data.last_name ?? undefined,
    displayName: data.display_name ?? undefined,
    phone: data.phone ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
  };
}

export async function getAppRoles(appId = 'agent-workspace'): Promise<AppRole[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await getSupabaseClient()
    .from('user_roles')
    .select('role, app_id')
    .eq('user_id', user.id)
    .eq('app_id', appId);

  if (error) {
    return [];
  }

  return (data ?? []).map((row) => ({
    role: row.role as string,
    appId: row.app_id as string,
  }));
}

export async function hasRole(role: string, appId = 'agent-workspace'): Promise<boolean> {
  const roles = await getAppRoles(appId);
  return roles.some((entry) => entry.role === role);
}

export async function hasAppAccess(appId = 'agent-workspace'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const { data, error } = await getSupabaseClient()
    .from('app_access')
    .select('app_id')
    .eq('user_id', user.id)
    .eq('app_id', appId)
    .maybeSingle();

  if (error || !data) {
    return true;
  }

  return Boolean(data.app_id);
}

export function onAuthStateChange(
  callback: (session: Session | null) => void,
): { unsubscribe: () => void } {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}
