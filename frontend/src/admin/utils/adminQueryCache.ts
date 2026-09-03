import type { QueryClient } from '@tanstack/react-query';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { vendorKeys } from '../../hooks/catalog/queryKeys.ts';
import { serviceKeys } from '../../hooks/services/queryKeys.ts';

export function invalidateAdminResource(
  queryClient: QueryClient,
  resourceKey: string,
): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: adminQueryKey(resourceKey) });
}

export function patchAdminListItemStatus<T extends { id: string; status?: string }>(
  queryClient: QueryClient,
  resourceKey: string,
  itemId: string,
  status: string,
): void {
  queryClient.setQueriesData<{ items: T[]; meta: unknown }>(
    { queryKey: adminQueryKey(resourceKey) },
    (old) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        items: old.items.map((item) => (item.id === itemId ? { ...item, status } : item)),
      };
    },
  );
}

export function patchAdminDetailRecord<T extends Record<string, unknown>>(
  queryClient: QueryClient,
  resourceKey: string,
  endpoint: string,
  patch: Partial<T>,
): void {
  queryClient.setQueryData<T | undefined>(adminQueryKey(resourceKey, endpoint), (old) =>
    old ? { ...old, ...patch } : old,
  );
}

export function syncAdminUserStatus(
  queryClient: QueryClient,
  userId: string,
  status: string,
): void {
  patchAdminListItemStatus(queryClient, 'admin-users', userId, status);
  patchAdminDetailRecord(queryClient, 'admin-user-detail', `/admin/users/${userId}`, { status });
}

export function syncAdminVendorStatus(
  queryClient: QueryClient,
  vendorId: string,
  status: string,
): void {
  patchAdminListItemStatus(queryClient, 'admin-vendors', vendorId, status);
  patchAdminDetailRecord(queryClient, 'admin-vendor-detail', `/admin/vendor-accounts/${vendorId}`, {
    status,
  });
}

export function syncAdminProviderStatus(
  queryClient: QueryClient,
  providerId: string,
  status: string,
): void {
  patchAdminListItemStatus(queryClient, 'admin-providers', providerId, status);
  patchAdminDetailRecord(
    queryClient,
    'admin-provider-detail',
    `/admin/provider-accounts/${providerId}`,
    { status },
  );
}

export function syncAdminAffiliateStatus(
  queryClient: QueryClient,
  affiliateId: string,
  status: string,
): void {
  patchAdminListItemStatus(queryClient, 'admin-affiliate-profiles', affiliateId, status);
  patchAdminDetailRecord(
    queryClient,
    'admin-affiliate-detail',
    `/admin/affiliate/profiles/${affiliateId}`,
    { status },
  );
}

export function syncAdminPayoutStatus(
  queryClient: QueryClient,
  kind: 'vendor' | 'provider' | 'affiliate',
  payoutId: string,
  status: string,
): void {
  const resourceKey =
    kind === 'vendor'
      ? 'admin-vendor-payouts'
      : kind === 'provider'
        ? 'admin-provider-payouts'
        : 'admin-affiliate-payouts';
  patchAdminListItemStatus(queryClient, resourceKey, payoutId, status);
}

export function invalidatePublicVendorStore(queryClient: QueryClient, slug: string): void {
  queryClient.removeQueries({ queryKey: vendorKeys.detail(slug) });
  queryClient.removeQueries({ queryKey: vendorKeys.all });
}

export function invalidatePublicProviderStore(queryClient: QueryClient, slug: string): void {
  queryClient.removeQueries({ queryKey: serviceKeys.providers.detail(slug) });
  queryClient.removeQueries({ queryKey: serviceKeys.providers.all });
}
