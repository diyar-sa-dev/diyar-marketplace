import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '../../common/LoadingState.tsx';
import { RoleName, hasCustomerRole } from '../../../lib/auth/roles.ts';
import { useAuthContext } from '../../../context/AuthContext.tsx';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import { useVendorAccess, vendorAccessKeys, vendorTeamKeys } from '../../../hooks/vendor/useVendorTeam.ts';
import { vendorFinanceKeys } from '../../../hooks/vendor/useVendorFinance.ts';
import { isForbidden, parseApiError } from '../../../utils/errors.ts';
import type { AuthUser } from '../../../types/auth.ts';

type VendorPortalGuardProps = {
  children: React.ReactNode;
};

function stripVendorRole(user: AuthUser): AuthUser {
  return {
    ...user,
    roles: (user.roles ?? []).filter((role) => role.name !== RoleName.Vendor),
    vendor_account: null,
  };
}

function resolveAccessLostPath(user: AuthUser | null): string {
  if (user && hasCustomerRole(user.roles)) {
    return '/profile';
  }

  return '/';
}

export function VendorPortalGuard({ children }: VendorPortalGuardProps) {
  const queryClient = useQueryClient();
  const { refreshUser, updateUser } = useAuthContext();
  const { t } = useLocale();
  const { toast } = useToast();
  const handledRef = useRef(false);
  const accessQuery = useVendorAccess(true);

  useEffect(() => {
    if (!accessQuery.isError || handledRef.current) {
      return;
    }

    const parsed = parseApiError(accessQuery.error);
    if (!isForbidden(parsed)) {
      return;
    }

    handledRef.current = true;

    void (async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: vendorAccessKeys.all }),
        queryClient.cancelQueries({ queryKey: vendorFinanceKeys.all }),
        queryClient.cancelQueries({ queryKey: vendorTeamKeys.all }),
      ]);

      queryClient.removeQueries({ queryKey: vendorAccessKeys.all });
      queryClient.removeQueries({ queryKey: vendorFinanceKeys.all });
      queryClient.removeQueries({ queryKey: vendorTeamKeys.all });

      let user: AuthUser | null = null;

      try {
        user = await refreshUser();
      } catch {
        user = null;
      }

      if (user) {
        updateUser(stripVendorRole(user));
      }

      toast.warning(t('vendor.accessRevoked'));

      window.location.replace(resolveAccessLostPath(user));
    })();
  }, [
    accessQuery.isError,
    accessQuery.error,
    queryClient,
    refreshUser,
    updateUser,
    t,
    toast,
  ]);

  if (accessQuery.isLoading) {
    return <LoadingState className="min-h-[40vh]" message={t('common.verifyingSession')} />;
  }

  if (accessQuery.isError) {
    const parsed = parseApiError(accessQuery.error);

    if (isForbidden(parsed)) {
      return <LoadingState className="min-h-[40vh]" message={t('vendor.accessRevokedRedirect')} />;
    }
  }

  if (accessQuery.isError || !accessQuery.data) {
    return null;
  }

  return children;
}
