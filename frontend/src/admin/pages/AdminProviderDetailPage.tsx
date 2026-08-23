import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ExternalLink, Hash, Mail, MapPin, Phone, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';
import { confirmSuspendProvider } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminDetailField } from '../components/AdminDetailField.tsx';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';
import {
  invalidateAdminResource,
  invalidatePublicProviderStore,
  syncAdminProviderStatus,
} from '../utils/adminQueryCache.ts';

type ProviderDetail = {
  id: string;
  business_name: string;
  slug: string;
  status: string;
  location?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  created_at?: string;
  user?: { id: string; name: string; email?: string | null; phone?: string | null };
};

export default function AdminProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const detailEndpoint = `/admin/provider-accounts/${providerId}`;

  const {
    data: provider,
    isLoading,
    isError,
  } = useAdminDetailQuery<ProviderDetail>({
    resourceKey: 'admin-provider-detail',
    endpoint: detailEndpoint,
    dataKey: 'provider_account',
    enabled: Boolean(providerId),
  });

  const commitProviderUpdate = (updated: ProviderDetail) => {
    queryClient.setQueryData<ProviderDetail>(
      adminQueryKey('admin-provider-detail', detailEndpoint),
      updated,
    );
    syncAdminProviderStatus(queryClient, updated.id, updated.status);
    invalidatePublicProviderStore(queryClient, updated.slug);
  };

  const suspendMutation = useMutation({
    mutationFn: async (action: 'suspend' | 'activate') => {
      const response = await adminApi.post<{ data: { provider_account: ProviderDetail } }>(
        `/admin/provider-accounts/${providerId}/${action}`,
      );
      return { action, account: response.data.data.provider_account };
    },
    onSuccess: ({ account }) => {
      if (account) {
        commitProviderUpdate(account);
      }
      toast.success(t('admin.detail.provider.updated'));
      void invalidateAdminResource(queryClient, 'admin-providers');
    },
    onError: () => {
      toast.error(t('admin.detail.provider.actionError'));
      void invalidateAdminResource(queryClient, 'admin-provider-detail');
      void invalidateAdminResource(queryClient, 'admin-providers');
    },
  });

  if (isLoading) return <AdminPageSkeleton />;
  if (isError || !provider) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.providers.empty')}
      </div>
    );
  }

  const storefrontUrl = `/provider/${provider.slug}`;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-diyar-dark to-[#2d524e] px-6 py-6 text-white">
          <Link
            to="/admin/providers"
            className="mb-4 inline-flex text-sm font-semibold text-white/70 hover:text-white"
          >
            ← {t('admin.detail.backToProviders')}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Wrench size={26} strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">{provider.business_name}</h1>
                <p className="mt-1 text-sm text-white/70 font-mono" dir="ltr">
                  {provider.slug}
                </p>
                <div className="mt-2">
                  <AdminStatusBadge status={provider.status} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold text-white hover:bg-white/20"
                title={t('admin.detail.provider.viewStorefront')}
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">{t('admin.detail.provider.openPage')}</span>
              </Link>
              {provider.status === 'suspended' ? (
                <PermissionGate permission="providers.suspend">
                  <button
                    type="button"
                    disabled={suspendMutation.isPending}
                    onClick={() => suspendMutation.mutate('activate')}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.provider.activate')}
                  </button>
                </PermissionGate>
              ) : (
                <PermissionGate permission="providers.suspend">
                  <button
                    type="button"
                    disabled={suspendMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmSuspendProvider(t, provider.business_name);
                      if (confirmed) {
                        suspendMutation.mutate('suspend');
                      }
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.provider.suspend')}
                  </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>
      </div>

      <DetailTabs
        tabs={[
          { id: 'profile', label: t('admin.detail.tabs.profile') },
          { id: 'owner', label: t('admin.detail.tabs.owner') },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {activeTab === 'profile' ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <AdminDetailField label={t('admin.tables.business')} icon={<Wrench size={18} />}>
              {provider.business_name}
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.slug')} icon={<Hash size={18} />}>
              <span dir="ltr">{provider.slug}</span>
            </AdminDetailField>
            <AdminDetailField label={t('admin.detail.vendor.location')} icon={<MapPin size={18} />}>
              {provider.location ?? '—'}
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.createdAt')} icon={<Calendar size={18} />}>
              {provider.created_at ? formatLocaleDateTime(provider.created_at, locale) : '—'}
            </AdminDetailField>
            <AdminDetailField
              label={t('admin.detail.vendor.supportEmail')}
              icon={<Mail size={18} />}
            >
              <span dir="ltr">{provider.support_email ?? '—'}</span>
            </AdminDetailField>
            <AdminDetailField
              label={t('admin.detail.vendor.supportPhone')}
              icon={<Phone size={18} />}
            >
              <span dir="ltr">{formatPhoneDisplay(provider.support_phone) ?? '—'}</span>
            </AdminDetailField>
          </dl>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <AdminDetailField label={t('admin.tables.name')}>
              {provider.user ? (
                <Link
                  to={`/admin/users/${provider.user.id}`}
                  className="font-semibold text-diyar-brown hover:text-diyar-dark"
                >
                  {provider.user.name}
                </Link>
              ) : (
                '—'
              )}
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.contact')}>
              <span dir="ltr">
                {provider.user?.email ?? formatPhoneDisplay(provider.user?.phone) ?? '—'}
              </span>
            </AdminDetailField>
          </dl>
        )}
      </div>
    </div>
  );
}
