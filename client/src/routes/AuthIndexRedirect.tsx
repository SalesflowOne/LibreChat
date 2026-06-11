import { Navigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
export default function AuthIndexRedirect() {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/home" replace />;
}
