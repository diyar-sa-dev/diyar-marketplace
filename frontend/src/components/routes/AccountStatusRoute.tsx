import { Navigate } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { accountStatusPath, isActiveAccount } from '../../lib/auth/accountStatus.ts';
import { primaryDashboardPath } from '../../lib/auth/roles.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { LoadingState } from '../common/LoadingState.tsx';

type AccountStatusRouteProps = {
  children: React.ReactNode;
  allowed: 'pending' | 'suspended';
};

export function AccountStatusRoute({ children, allowed }: AccountStatusRouteProps) {
  const { status, isAuthenticated, user } = useAuthContext();
  const { t } = useLocale();

  if (status === 'loading') {
    return <LoadingState message={t('common.verifyingSession')} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ reason: 'auth_required' }} />;
  }

  const statusPath = accountStatusPath(user?.status);

  if (allowed === 'pending' && user?.status !== 'pending') {
    if (isActiveAccount(user?.status)) {
      return <Navigate to={primaryDashboardPath(user?.roles)} replace />;
    }

    if (statusPath) {
      return <Navigate to={statusPath} replace />;
    }

    return <Navigate to="/" replace />;
  }

  if (allowed === 'suspended' && user?.status !== 'suspended' && user?.status !== 'rejected') {
    if (isActiveAccount(user?.status)) {
      return <Navigate to={primaryDashboardPath(user?.roles)} replace />;
    }

    if (statusPath) {
      return <Navigate to={statusPath} replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}
