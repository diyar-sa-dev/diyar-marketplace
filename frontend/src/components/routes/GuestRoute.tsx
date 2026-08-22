import { Navigate, useLocation } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale.ts';
import { accountStatusPath } from '../../lib/auth/accountStatus.ts';
import { LoadingState } from '../common/LoadingState.tsx';
import { useAuthContext } from '../../context/AuthContext.tsx';
import {
  ADMIN_PANEL_PATH,
  isAdminOnlyAccount,
  resolveSafeReturnPath,
} from '../../lib/auth/roles.ts';

type GuestRouteProps = {
  children: React.ReactNode;
};

export function GuestRoute({ children }: GuestRouteProps) {
  const { status, isAuthenticated, user } = useAuthContext();
  const location = useLocation();
  const { t } = useLocale();

  if (status === 'loading') {
    return <LoadingState message={t('common.verifyingSession')} />;
  }

  if (isAuthenticated) {
    const restrictedPath = accountStatusPath(user?.status);
    if (restrictedPath) {
      return <Navigate to={restrictedPath} replace />;
    }

    const authView = (location.state as { authView?: string } | null)?.authView;
    if (authView === 'forgot' || authView === 'reset') {
      return children;
    }

    if (isAdminOnlyAccount(user?.roles)) {
      return <Navigate to={ADMIN_PANEL_PATH} replace />;
    }

    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={resolveSafeReturnPath(from, user?.roles)} replace />;
  }

  return children;
}
