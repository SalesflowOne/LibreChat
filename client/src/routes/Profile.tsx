import { useEffect, useState } from 'react';
import { Button, Spinner } from '@librechat/client';
import { useNavigate } from 'react-router-dom';
import { useLocalize } from '~/hooks';
import { useAuthContext } from '~/hooks/AuthContext';
import { isSupabaseAuthEnabled, updatePassword, updateProfile } from '~/lib/auth';
import type { AuthProfile } from '~/lib/auth.types';

export default function Profile() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthContext();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseAuthEnabled()) {
      navigate('/c/new', { replace: true });
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    void (async () => {
      try {
        const { getProfile } = await import('~/lib/auth');
        const nextProfile = await getProfile();
        setProfile(nextProfile);
      } catch (profileError) {
        setError(
          profileError instanceof Error ? profileError.message : 'Failed to load profile.',
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, navigate]);

  if (!isSupabaseAuthEnabled()) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await updateProfile(profile);
      setProfile(saved);
      setMessage(localize('com_ui_profile_updated'));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!password) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updatePassword(password);
      setPassword('');
      setMessage(localize('com_ui_profile_password_updated'));
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Failed to update password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">{localize('com_ui_profile_title')}</h1>
        <p className="text-sm text-text-secondary">{localize('com_ui_profile_description')}</p>
      </div>

      {message ? <p className="text-sm text-green-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {profile ? (
        <div className="space-y-4 rounded-2xl border border-border-light p-4">
          <label className="block space-y-1">
            <span className="text-sm text-text-secondary">{localize('com_ui_profile_display_name')}</span>
            <input
              className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2"
              value={profile.displayName ?? ''}
              onChange={(event) =>
                setProfile({ ...profile, displayName: event.target.value })
              }
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-text-secondary">{localize('com_ui_profile_first_name')}</span>
            <input
              className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2"
              value={profile.firstName ?? ''}
              onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-text-secondary">{localize('com_ui_profile_last_name')}</span>
            <input
              className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2"
              value={profile.lastName ?? ''}
              onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm text-text-secondary">{localize('com_auth_email')}</span>
            <input
              className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2"
              value={profile.email}
              disabled
            />
          </label>
          <Button type="button" onClick={() => void handleSaveProfile()} disabled={isSaving}>
            {localize('com_ui_profile_save')}
          </Button>
        </div>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-border-light p-4">
        <h2 className="text-lg font-medium text-text-primary">{localize('com_auth_password')}</h2>
        <input
          type="password"
          className="w-full rounded-xl border border-border-light bg-surface-primary px-3 py-2"
          placeholder={localize('com_ui_profile_new_password')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="button" variant="outline" onClick={() => void handleUpdatePassword()} disabled={isSaving}>
          {localize('com_ui_profile_update_password')}
        </Button>
      </div>

      <Button type="button" variant="ghost" onClick={() => logout('/login')}>
        {localize('com_nav_log_out')}
      </Button>
    </div>
  );
}
