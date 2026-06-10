import { ClerkProvider } from '@clerk/react';
import type { ReactNode } from 'react';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const clerkDomain = import.meta.env.VITE_CLERK_DOMAIN as string | undefined;
const isSatellite = import.meta.env.VITE_CLERK_IS_SATELLITE === 'true';
const signInUrl = import.meta.env.VITE_CLERK_SIGN_IN_URL as string | undefined;
const signUpUrl = import.meta.env.VITE_CLERK_SIGN_UP_URL as string | undefined;

export function isClerkEnabled(): boolean {
  return Boolean(publishableKey?.trim());
}

export default function ClerkRoot({ children }: { children: ReactNode }) {
  if (!isClerkEnabled()) {
    return children;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      domain={clerkDomain}
      isSatellite={isSatellite}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
    >
      {children}
    </ClerkProvider>
  );
}
