import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext.tsx';
import {
  hasCustomerRoleAssignment,
  requiresCustomerRoleForProfilePath,
  resolveAccountHubPath,
} from '../../lib/auth/roles.ts';
import { ProtectedRoute } from './ProtectedRoute.tsx';

type CustomerProfileRouteProps = {
  children: React.ReactNode;
};

function CustomerProfileGuard({ children }: CustomerProfileRouteProps) {
  const { user } = useAuthContext();
  const location = useLocation();

  if (
    requiresCustomerRoleForProfilePath(location.pathname) &&
    !hasCustomerRoleAssignment(user?.roles)
  ) {
    return <Navigate to={resolveAccountHubPath(user?.roles)} replace />;
  }

  return children;
}

export function CustomerProfileRoute({ children }: CustomerProfileRouteProps) {
  return (
    <ProtectedRoute>
      <CustomerProfileGuard>{children}</CustomerProfileGuard>
    </ProtectedRoute>
  );
}
