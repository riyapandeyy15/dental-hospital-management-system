import { Navigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import LoadingScreen from '../components/shared/LoadingScreen.jsx';

// Wrap a route element: redirects to /login if not authenticated, or to
// /unauthorized if authenticated but not in `allowedRoles`. Frontend role
// checks are for navigation/UX only - the backend re-checks every request.
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
