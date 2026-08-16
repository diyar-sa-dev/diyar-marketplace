import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { accountStatusPath } from '../../lib/auth/accountStatus.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';

const ALLOWED_PREFIXES = ['/account/pending', '/account/suspended'];

type AccountStatusGuardProps = {
  children: ReactNode;
};

export function AccountStatusGuard({ children }: AccountStatusGuardProps) {
  const { status, isAuthenticated, user } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (status !== 'authenticated' || !isAuthenticated) {
      return;
    }

    const restrictedPath = accountStatusPath(user?.status);
    if (!restrictedPath) {
      return;
    }

    if (ALLOWED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))) {
      return;
    }

    navigate(restrictedPath, {
      replace: true,
      state: { from: location.pathname, reason: user?.status },
    });
  }, [status, isAuthenticated, user?.status, location.pathname, navigate]);

  return children;
}
