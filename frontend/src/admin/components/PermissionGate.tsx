import type { ReactNode } from 'react';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';

type PermissionGateProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = useAdminAuth();

  if (!hasPermission(permission)) {
    return fallback;
  }

  return children;
}
