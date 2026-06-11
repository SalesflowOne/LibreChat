import { Navigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import { isClerkEnabled } from '~/components/Auth/Clerk/ClerkRoot';

export default function AuthIndexRedirect() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/home" replace />;
}
