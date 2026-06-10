import { useEffect } from 'react';
import { Spinner } from '@librechat/client';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';

export default function ClerkSignInRedirect() {
  useEffect(() => {
    if (!isClerkEnabled()) {
      return;
    }
    const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL as string | undefined;
    if (signInUrl) {
      window.location.replace(signInUrl);
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
