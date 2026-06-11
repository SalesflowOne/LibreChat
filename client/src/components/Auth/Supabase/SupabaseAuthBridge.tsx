import { useSupabaseAuthBridge } from '~/hooks/useSupabaseAuthBridge';

export default function SupabaseAuthBridge({
  onAuthenticated,
  onSignedOut,
}: {
  onAuthenticated: (token: string, user: Record<string, unknown>) => void;
  onSignedOut: () => void;
}) {
  useSupabaseAuthBridge({ onAuthenticated, onSignedOut });
  return null;
}
