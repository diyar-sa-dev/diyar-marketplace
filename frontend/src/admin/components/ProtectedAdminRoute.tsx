import { Navigate, useLocation } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { accountStatusPath } from '../../lib/auth/accountStatus.ts';
import { RoleName } from '../../lib/auth/roles.ts';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';

type ProtectedAdminRouteProps = {
  children: React.ReactNode;
};

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { status, isAuthenticated, hasRole, user } = useAdminAuth();
  const location = useLocation();
  const { t } = useLocale();

  if (status === 'loading') {
    return <LoadingState message={t('common.verifyingSession')} />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate to="/admin/login" replace state={{ from: returnTo, reason: 'auth_required' }} />
    );
  }

  const restrictedPath = accountStatusPath(user?.status);
  if (restrictedPath) {
    return <Navigate to={restrictedPath} replace state={{ reason: user?.status }} />;
  }

  if (!hasRole(RoleName.Admin)) {
    return <Navigate to="/403" replace state={{ from: location.pathname, reason: 'forbidden' }} />;
  }

  return children;
}
