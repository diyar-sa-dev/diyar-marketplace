import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ExternalLink, Hash, Mail, MapPin, Phone, Store } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';
import { confirmSuspendVendor } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminDetailField } from '../components/AdminDetailField.tsx';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';
import {
  invalidateAdminResource,
  invalidatePublicVendorStore,
  syncAdminVendorStatus,
} from '../utils/adminQueryCache.ts';

type VendorDetail = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  location?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  created_at?: string;
  user?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
  };
};

export default function AdminVendorDetailPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { t } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const detailEndpoint = `/admin/vendor-accounts/${vendorId}`;

  const {
    data: vendor,
    isLoading,
    isError,
  } = useAdminDetailQuery<VendorDetail>({
    resourceKey: 'admin-vendor-detail',
    endpoint: detailEndpoint,
    dataKey: 'vendor_account',
    enabled: Boolean(vendorId),
  });

  const commitVendorUpdate = (updated: VendorDetail) => {
    queryClient.setQueryData<VendorDetail>(adminQueryKey('admin-vendor-detail', detailEndpoint), updated);
    syncAdminVendorStatus(queryClient, updated.id, updated.status);
    invalidatePublicVendorStore(queryClient, updated.slug);
  };

  const suspendMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post<{ data: { vendor_account: VendorDetail } }>(
        `/admin/vendor-accounts/${vendorId}/suspend`,
      );
      return response.data.data.vendor_account;
    },
    onSuccess: (updated) => {
      if (updated) {
        commitVendorUpdate(updated);
      }
      showToast(t('admin.detail.vendor.suspended'), 'success');
      void invalidateAdminResource(queryClient, 'admin-vendors');
    },
    onError: () => {
      showToast(t('admin.detail.vendor.actionError'), 'error');
      void invalidateAdminResource(queryClient, 'admin-vendor-detail');
      void invalidateAdminResource(queryClient, 'admin-vendors');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post<{ data: { vendor_account: VendorDetail } }>(
        `/admin/vendor-accounts/${vendorId}/activate`,
      );
      return response.data.data.vendor_account;
    },
    onSuccess: (updated) => {
      if (updated) {
        commitVendorUpdate(updated);
      }
      showToast(t('admin.detail.vendor.activated'), 'success');
      void invalidateAdminResource(queryClient, 'admin-vendors');
    },
    onError: () => {
      showToast(t('admin.detail.vendor.actionError'), 'error');
      void invalidateAdminResource(queryClient, 'admin-vendor-detail');
      void invalidateAdminResource(queryClient, 'admin-vendors');
    },
  });

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError || !vendor) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.detail.vendor.loadError')}
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('admin.detail.tabs.profile') },
    { id: 'owner', label: t('admin.detail.tabs.owner') },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-diyar-dark to-[#2d524e] px-6 py-6 text-white">
          <Link
            to="/admin/vendors"
            className="mb-4 inline-flex text-sm font-semibold text-white/70 hover:text-white"
          >
            ← {t('admin.detail.backToVendors')}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Store size={28} strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">{vendor.business_name}</h1>
                <p className="mt-1 text-sm text-white/70 font-mono" dir="ltr">
                  {vendor.slug}
                </p>
                <div className="mt-2">
                  <AdminStatusBadge status={vendor.status} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/store/${vendor.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
                title={t('admin.detail.vendor.viewStorefront')}
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">{t('admin.detail.vendor.openStore')}</span>
              </Link>
              {vendor.status === 'suspended' ? (
                <PermissionGate permission="vendors.suspend">
                  <button
                    type="button"
                    disabled={activateMutation.isPending}
                    onClick={() => activateMutation.mutate()}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.vendor.activate')}
                  </button>
                </PermissionGate>
              ) : (
                <PermissionGate permission="vendors.suspend">
                  <button
                    type="button"
                    disabled={suspendMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmSuspendVendor(t, vendor.business_name);
                      if (confirmed) {
                        suspendMutation.mutate();
                      }
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.vendor.suspend')}
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>
      </div>

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {activeTab === 'profile' ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <AdminDetailField label={t('admin.tables.business')} icon={<Store size={18} />}>
              {vendor.business_name}
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.slug')} icon={<Hash size={18} />}>
              <span dir="ltr">{vendor.slug}</span>
            </AdminDetailField>
            <AdminDetailField label={t('admin.detail.vendor.location')} icon={<MapPin size={18} />}>
              {vendor.location ?? '—'}
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.createdAt')} icon={<Calendar size={18} />}>
              {vendor.created_at ? new Date(vendor.created_at).toLocaleString() : '—'}
            </AdminDetailField>
            <AdminDetailField label={t('admin.detail.vendor.supportEmail')} icon={<Mail size={18} />}>
              <span dir="ltr">{vendor.support_email ?? '—'}</span>
            </AdminDetailField>
            <AdminDetailField label={t('admin.detail.vendor.supportPhone')} icon={<Phone size={18} />}>
              <span dir="ltr">{formatPhoneDisplay(vendor.support_phone) ?? '—'}</span>
            </AdminDetailField>
          </dl>
        ) : null}

        {activeTab === 'owner' ? (
          vendor.user ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <AdminDetailField label={t('admin.tables.name')}>
                <Link
                  to={`/admin/users/${vendor.user.id}`}
                  className="font-semibold text-diyar-brown hover:text-diyar-dark"
                >
                  {vendor.user.name}
                </Link>
              </AdminDetailField>
              <AdminDetailField label={t('admin.tables.contact')}>
                <span dir="ltr">{vendor.user.email ?? formatPhoneDisplay(vendor.user.phone) ?? '—'}</span>
              </AdminDetailField>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">{t('admin.detail.vendor.noOwner')}</p>
          )
        ) : null}
      </div>
    </div>
  );
}
