import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { DetailHeader } from '../components/DetailHeader.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';

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

  const {
    data: vendor,
    isLoading,
    isError,
  } = useAdminDetailQuery<VendorDetail>({
    resourceKey: 'admin-vendor-detail',
    endpoint: `/admin/vendor-accounts/${vendorId}`,
    dataKey: 'vendor_account',
    enabled: Boolean(vendorId),
  });

  const suspendMutation = useMutation({
    mutationFn: async () => {
      await adminApi.post(`/admin/vendor-accounts/${vendorId}/suspend`);
    },
    onSuccess: async () => {
      showToast(t('admin.detail.vendor.suspended'), 'success');
      await queryClient.invalidateQueries({ queryKey: ['admin-vendor-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
    onError: () => showToast(t('admin.detail.vendor.actionError'), 'error'),
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      await adminApi.post(`/admin/vendor-accounts/${vendorId}/activate`);
    },
    onSuccess: async () => {
      showToast(t('admin.detail.vendor.activated'), 'success');
      await queryClient.invalidateQueries({ queryKey: ['admin-vendor-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
    },
    onError: () => showToast(t('admin.detail.vendor.actionError'), 'error'),
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
      <DetailHeader
        backTo="/admin/vendors"
        backLabel={t('admin.detail.backToVendors')}
        title={vendor.business_name}
        subtitle={vendor.slug}
        status={vendor.status}
        actions={
          <>
            <Link
              to={`/store/${vendor.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-diyar-brown hover:text-diyar-brown"
            >
              <ExternalLink size={16} />
              {t('admin.detail.vendor.viewStorefront')}
            </Link>
            {vendor.status === 'suspended' ? (
              <PermissionGate permission="vendors.suspend">
                <button
                  type="button"
                  disabled={activateMutation.isPending}
                  onClick={() => activateMutation.mutate()}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                >
                  {t('admin.detail.vendor.activate')}
                </button>
              </PermissionGate>
            ) : (
              <PermissionGate permission="vendors.suspend">
                <button
                  type="button"
                  disabled={suspendMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('admin.detail.vendor.suspendConfirm'))) {
                      suspendMutation.mutate();
                    }
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                >
                  {t('admin.detail.vendor.suspend')}
                </button>
              </PermissionGate>
            )}
          </>
        }
      />

      <DetailTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {activeTab === 'profile' ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.business')}
              </dt>
              <dd className="mt-1 font-semibold text-diyar-dark">{vendor.business_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.slug')}
              </dt>
              <dd className="mt-1 font-mono text-sm text-gray-700">{vendor.slug}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.vendor.location')}
              </dt>
              <dd className="mt-1 text-gray-700">{vendor.location ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.tables.createdAt')}
              </dt>
              <dd className="mt-1 text-gray-700">
                {vendor.created_at ? new Date(vendor.created_at).toLocaleString() : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.vendor.supportEmail')}
              </dt>
              <dd className="mt-1 text-gray-700">{vendor.support_email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.detail.vendor.supportPhone')}
              </dt>
              <dd className="mt-1 text-gray-700">{vendor.support_phone ?? '—'}</dd>
            </div>
          </dl>
        ) : null}

        {activeTab === 'owner' ? (
          vendor.user ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.name')}
                </dt>
                <dd className="mt-1">
                  <Link
                    to={`/admin/users/${vendor.user.id}`}
                    className="font-semibold text-diyar-brown hover:text-diyar-dark"
                  >
                    {vendor.user.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {t('admin.tables.contact')}
                </dt>
                <dd className="mt-1 text-gray-700">
                  {vendor.user.email ?? vendor.user.phone ?? '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-500">{t('admin.detail.vendor.noOwner')}</p>
          )
        ) : null}
      </div>
    </div>
  );
}
