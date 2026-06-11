import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { Spinner } from '@librechat/client';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';
import { buildSatelliteSignInUrl, getClerkReturnUrl } from '~/components/Auth/Clerk/clerkUrls';

export default function ClerkSignInRedirect() {
  const { buildSignInUrl } = useClerk();
  const location = useLocation();

  useEffect(() => {
    if (!isClerkEnabled()) {
      return;
    }

    const returnUrl = getClerkReturnUrl(location.pathname, location.search, location.hash);
    const signInUrl = buildSatelliteSignInUrl(buildSignInUrl, returnUrl);
    window.location.replace(signInUrl);
  }, [buildSignInUrl, location.hash, location.pathname, location.search]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-primary">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
