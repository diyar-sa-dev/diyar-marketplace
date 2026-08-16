import { Navigate, useLocation } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { accountStatusPath } from '../../lib/auth/accountStatus.ts';
import { LoadingState } from '../common/LoadingState.tsx';
import { useAuthContext } from '../../context/AuthContext.tsx';

type ProtectedRouteProps = {
  children: React.ReactNode;
  roles?: string[];
};

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { status, isAuthenticated, hasRole, user } = useAuthContext();
  const location = useLocation();
  const { t } = useLocale();

  if (status === 'loading') {
    return <LoadingState message={t('common.verifyingSession')} />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname, reason: 'auth_required' }}
      />
    );
  }

  const restrictedPath = accountStatusPath(user?.status);
  if (restrictedPath) {
    return (
      <Navigate
        to={restrictedPath}
        replace
        state={{ from: location.pathname, reason: user?.status }}
      />
    );
  }

  if (roles && roles.length > 0 && !roles.some((role) => hasRole(role))) {
    return (
      <Navigate
        to="/403"
        replace
        state={{ from: location.pathname, reason: 'forbidden' }}
      />
    );
  }

  return children;
}
