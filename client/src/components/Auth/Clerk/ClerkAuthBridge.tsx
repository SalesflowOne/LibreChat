import { useClerkAuthBridge } from '~/hooks/useClerkAuthBridge';

export default function ClerkAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  useClerkAuthBridge({ onAuthenticated, onSignedOut });
  return null;
}
