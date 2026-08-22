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

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium text-diyar-dark">{children}</dd>
    </div>
  );
}

export default function AdminProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const {
    data: provider,
    isLoading,
    isError,
  } = useAdminDetailQuery<ProviderDetail>({
    resourceKey: 'admin-provider-detail',
    endpoint: `/admin/provider-accounts/${providerId}`,
    dataKey: 'provider_account',
    enabled: Boolean(providerId),
  });

  const suspendMutation = useMutation({
    mutationFn: async (action: 'suspend' | 'activate') => {
      await adminApi.post(`/admin/provider-accounts/${providerId}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.detail.provider.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-provider-detail'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    },
    onError: () => toast.error(t('admin.detail.provider.actionError')),
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
      <DetailHeader
        backTo="/admin/providers"
        backLabel={t('admin.detail.backToProviders')}
        title={provider.business_name}
        subtitle={provider.slug}
        status={provider.status}
        actions={
          <>
            <Link
              to={storefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-diyar-brown hover:text-diyar-brown"
            >
              <ExternalLink size={16} />
              {t('admin.detail.provider.viewStorefront')}
            </Link>
            {provider.status === 'suspended' ? (
              <PermissionGate permission="providers.suspend">
                <button
                  type="button"
                  disabled={suspendMutation.isPending}
                  onClick={() => suspendMutation.mutate('activate')}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 cursor-pointer"
                >
                  {t('admin.detail.provider.activate')}
                </button>
              </PermissionGate>
            ) : (
              <PermissionGate permission="providers.suspend">
                <button
                  type="button"
                  disabled={suspendMutation.isPending}
                  onClick={() => {
                    if (window.confirm(t('admin.detail.provider.suspendConfirm'))) {
                      suspendMutation.mutate('suspend');
                    }
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 cursor-pointer"
                >
                  {t('admin.detail.provider.suspend')}
                </button>
              </PermissionGate>
            )}
          </>
        }
      />

      <DetailTabs
        tabs={[
          { id: 'profile', label: t('admin.detail.tabs.profile') },
          { id: 'owner', label: t('admin.detail.tabs.owner') },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        {activeTab === 'profile' ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label={t('admin.tables.business')}>{provider.business_name}</DetailField>
            <DetailField label={t('admin.tables.slug')}>
              <span dir="ltr">{provider.slug}</span>
            </DetailField>
            <DetailField label={t('admin.detail.vendor.location')}>
              {provider.location ?? '—'}
            </DetailField>
            <DetailField label={t('admin.tables.createdAt')}>
              {provider.created_at ? new Date(provider.created_at).toLocaleString() : '—'}
            </DetailField>
            <DetailField label={t('admin.detail.vendor.supportEmail')}>
              {provider.support_email ?? '—'}
            </DetailField>
            <DetailField label={t('admin.detail.vendor.supportPhone')}>
              {provider.support_phone ?? '—'}
            </DetailField>
          </dl>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailField label={t('admin.tables.name')}>
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
            </DetailField>
            <DetailField label={t('admin.tables.contact')}>
              <span dir="ltr">{provider.user?.email ?? provider.user?.phone ?? '—'}</span>
            </DetailField>
          </dl>
        )}
      </div>
    </div>
  );
}
