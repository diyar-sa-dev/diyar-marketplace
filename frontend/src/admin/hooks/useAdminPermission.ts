import { useAdminAuth } from '../auth/AdminAuthContext.tsx';

export function useAdminPermission(permission: string): boolean {
  const { hasPermission } = useAdminAuth();
  return hasPermission(permission);
}
