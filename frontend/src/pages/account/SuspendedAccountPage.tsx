import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { useToast } from '../../hooks/useToast.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { isActiveAccount } from '../../lib/auth/accountStatus.ts';
import { primaryDashboardPath } from '../../lib/auth/roles.ts';
import { AccountStatusPage } from './AccountStatusPage.tsx';

export default function SuspendedAccountPage() {
  const { refreshUser, logout } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLocale();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refreshUser();
      if (isActiveAccount(refreshed?.status)) {
        toast.success(t('status.accountSuspended.reactivated'));
        navigate(primaryDashboardPath(refreshed?.roles), { replace: true });
        return;
      }

      toast.info(t('status.accountSuspended.stillSuspended'));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const result = await logout();
      toast.success(result.message ?? t('status.accountSuspended.logoutSuccess'));
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <AccountStatusPage
      variant="suspended"
      onRefresh={handleRefresh}
      onLogout={handleLogout}
      isRefreshing={isRefreshing}
      isLoggingOut={isLoggingOut}
    />
  );
}
