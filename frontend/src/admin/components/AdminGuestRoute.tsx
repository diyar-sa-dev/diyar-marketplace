import { Navigate, useLocation } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { accountStatusPath } from '../../lib/auth/accountStatus.ts';
import { ADMIN_PANEL_PATH, RoleName } from '../../lib/auth/roles.ts';
import { LoadingState } from '../../components/common/LoadingState.tsx';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';

type AdminGuestRouteProps = {
  children: React.ReactNode;
};

export function AdminGuestRoute({ children }: AdminGuestRouteProps) {
  const { status, isAuthenticated, hasRole, user } = useAdminAuth();
  const location = useLocation();
  const { t } = useLocale();

  if (status === 'loading') {
    return <LoadingState message={t('common.verifyingSession')} />;
  }

  if (isAuthenticated && hasRole(RoleName.Admin)) {
    const restrictedPath = accountStatusPath(user?.status);
    if (restrictedPath) {
      return <Navigate to={restrictedPath} replace />;
    }

    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? ADMIN_PANEL_PATH} replace />;
  }

  return children;
}
