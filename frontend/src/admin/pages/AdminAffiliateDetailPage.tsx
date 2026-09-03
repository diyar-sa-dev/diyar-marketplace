import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Hash, Landmark, Mail, Percent, Phone, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';
import { confirmSuspendAffiliate } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { AdminDetailField } from '../components/AdminDetailField.tsx';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';
import { invalidateAdminResource, syncAdminAffiliateStatus } from '../utils/adminQueryCache.ts';

type AffiliateDetail = {
  id: string;
  display_name?: string | null;
  referral_code?: string | null;
  status: string;
  payout_account_holder?: string | null;
  payout_iban_masked?: string | null;
  payout_bank_name?: string | null;
  payout_bank_code?: string | null;
  social_links?: Record<string, string> | string[] | null;
  created_at?: string;
  user?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    status?: string;
  } | null;
};

function socialLinkEntries(links: AffiliateDetail['social_links']): Array<[string, string]> {
  if (!links) return [];
  if (Array.isArray(links)) {
    return links.filter((value) => Boolean(value)).map((value, index) => [`${index + 1}`, value]);
  }
  return Object.entries(links).filter(([, value]) => Boolean(value));
}

export default function AdminAffiliateDetailPage() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const detailEndpoint = `/admin/affiliate/profiles/${affiliateId}`;

  const {
    data: profile,
    isLoading,
    isError,
  } = useAdminDetailQuery<AffiliateDetail>({
    resourceKey: 'admin-affiliate-detail',
    endpoint: detailEndpoint,
    dataKey: 'affiliate_profile',
    enabled: Boolean(affiliateId),
  });

  const commitUpdate = (updated: AffiliateDetail) => {
    queryClient.setQueryData<AffiliateDetail>(
      adminQueryKey('admin-affiliate-detail', detailEndpoint),
      updated,
    );
    syncAdminAffiliateStatus(queryClient, updated.id, updated.status);
  };

  const statusMutation = useMutation({
    mutationFn: async (action: 'suspend' | 'activate') => {
      const response = await adminApi.post<{ data: { affiliate_profile: AffiliateDetail } }>(
        `/admin/affiliate/profiles/${affiliateId}/${action}`,
      );
      return response.data.data.affiliate_profile;
    },
    onSuccess: (updated) => {
      if (updated) {
        commitUpdate(updated);
      }
      toast.success(
        updated?.status === 'suspended'
          ? t('admin.detail.affiliate.suspended')
          : t('admin.detail.affiliate.activated'),
      );
      void invalidateAdminResource(queryClient, 'admin-affiliate-profiles');
    },
    onError: () => {
      toast.error(t('admin.detail.affiliate.actionError'));
      void invalidateAdminResource(queryClient, 'admin-affiliate-detail');
      void invalidateAdminResource(queryClient, 'admin-affiliate-profiles');
    },
  });

  if (isLoading) return <AdminPageSkeleton />;
  if (isError || !profile) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.detail.affiliate.loadError')}
      </div>
    );
  }

  const displayName = profile.display_name || profile.user?.name || t('admin.nav.affiliate');
  const socials = socialLinkEntries(profile.social_links);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-diyar-dark to-[#2d524e] px-6 py-6 text-white">
          <Link
            to="/admin/affiliate"
            className="mb-4 inline-flex text-sm font-semibold text-white/70 hover:text-white"
          >
            ← {t('admin.detail.backToAffiliates')}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Percent size={26} strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold">{displayName}</h1>
                {profile.referral_code ? (
                  <p className="mt-1 text-sm text-white/70 font-mono" dir="ltr">
                    {profile.referral_code}
                  </p>
                ) : null}
                <div className="mt-2">
                  <AdminStatusBadge status={profile.status} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.status === 'suspended' ? (
                <PermissionGate permission="affiliate.manage">
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate('activate')}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.affiliate.activate')}
                  </button>
                </PermissionGate>
              ) : (
                <PermissionGate permission="affiliate.manage">
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmSuspendAffiliate(t, displayName);
                      if (confirmed) {
                        statusMutation.mutate('suspend');
                      }
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.affiliate.suspend')}
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
            <AdminDetailField label={t('admin.tables.name')} icon={<UserRound size={18} />}>
              {displayName}
            </AdminDetailField>
            <AdminDetailField label={t('admin.affiliate.referralCode')} icon={<Hash size={18} />}>
              <span dir="ltr">{profile.referral_code ?? '—'}</span>
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.createdAt')} icon={<Calendar size={18} />}>
              {profile.created_at ? formatLocaleDateTime(profile.created_at, locale) : '—'}
            </AdminDetailField>
            <AdminDetailField
              label={t('admin.affiliate.payoutHolder')}
              icon={<Landmark size={18} />}
            >
              {profile.payout_account_holder ?? '—'}
            </AdminDetailField>
            <AdminDetailField label={t('admin.affiliate.payoutIban')}>
              <span dir="ltr">{profile.payout_iban_masked ?? '—'}</span>
            </AdminDetailField>
            <AdminDetailField label={t('admin.affiliate.payoutBank')}>
              {profile.payout_bank_name ?? profile.payout_bank_code ?? '—'}
            </AdminDetailField>
            {socials.length > 0 ? (
              <AdminDetailField label={t('admin.affiliate.socialLinks')}>
                <ul className="space-y-1">
                  {socials.map(([label, value]) => (
                    <li key={`${label}-${value}`}>
                      <span className="text-xs text-gray-400">{label}: </span>
                      <span dir="ltr">{value}</span>
                    </li>
                  ))}
                </ul>
              </AdminDetailField>
            ) : null}
          </dl>
        ) : profile.user ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <AdminDetailField label={t('admin.tables.name')}>
              <Link
                to={`/admin/users/${profile.user.id}`}
                className="font-semibold text-diyar-brown hover:text-diyar-dark"
              >
                {profile.user.name}
              </Link>
            </AdminDetailField>
            <AdminDetailField label={t('admin.tables.contact')} icon={<Mail size={18} />}>
              <span dir="ltr">
                {profile.user.email ?? formatPhoneDisplay(profile.user.phone) ?? '—'}
              </span>
            </AdminDetailField>
            {profile.user.phone ? (
              <AdminDetailField label={t('admin.detail.vendor.supportPhone')} icon={<Phone size={18} />}>
                <span dir="ltr">{formatPhoneDisplay(profile.user.phone)}</span>
              </AdminDetailField>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-gray-500">{t('admin.detail.vendor.noOwner')}</p>
        )}
      </div>
    </div>
  );
}
