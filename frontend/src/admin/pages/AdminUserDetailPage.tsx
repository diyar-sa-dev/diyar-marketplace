import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Mail, Phone, Store, Wrench } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { formatPhoneDisplay } from '../../lib/formatPhone.ts';
import { confirmActivateUser, confirmSuspendUser } from '../../lib/confirmDialog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { formatLocaleDateTime } from '../../lib/intlLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminUserRoleBadges } from '../components/AdminRoleBadge.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { invalidateAdminResource, syncAdminUserStatus } from '../utils/adminQueryCache.ts';

type UserDetail = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  status: string;
  created_at?: string;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  roles?: Array<{ id: string; name: string; label: string; status: string }>;
  vendor_account?: { id: string; slug: string; store_name: string } | null;
  provider_account?: { id: string; slug: string; business_name: string } | null;
};

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t, locale } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const detailEndpoint = `/admin/users/${userId}`;

  const {
    data: user,
    isLoading,
    isError,
  } = useAdminDetailQuery<UserDetail>({
    resourceKey: 'admin-user-detail',
    endpoint: detailEndpoint,
    dataKey: 'user',
    enabled: Boolean(userId),
  });

  const isCurrentUser = Boolean(user && currentUser && user.id === currentUser.id);

  const applyUserStatus = (status: string, updated?: UserDetail) => {
    if (!userId) return;
    if (updated) {
      queryClient.setQueryData<UserDetail>(
        adminQueryKey('admin-user-detail', detailEndpoint),
        updated,
      );
    }
    syncAdminUserStatus(queryClient, userId, status);
  };

  const suspendMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post<{ data: { user: UserDetail } }>(
        `/admin/users/${userId}/suspend`,
      );
      return response.data.data.user;
    },
    onSuccess: (updated) => {
      applyUserStatus(updated?.status ?? 'suspended', updated);
      showToast(t('admin.detail.user.suspended'), 'success');
      void invalidateAdminResource(queryClient, 'admin-users');
    },
    onError: () => {
      showToast(t('admin.detail.user.actionError'), 'error');
      void invalidateAdminResource(queryClient, 'admin-user-detail');
      void invalidateAdminResource(queryClient, 'admin-users');
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.post<{ data: { user: UserDetail } }>(
        `/admin/users/${userId}/activate`,
      );
      return response.data.data.user;
    },
    onSuccess: (updated) => {
      applyUserStatus(updated?.status ?? 'active', updated);
      showToast(t('admin.detail.user.activated'), 'success');
      void invalidateAdminResource(queryClient, 'admin-users');
    },
    onError: () => {
      showToast(t('admin.detail.user.actionError'), 'error');
      void invalidateAdminResource(queryClient, 'admin-user-detail');
      void invalidateAdminResource(queryClient, 'admin-users');
    },
  });

  if (isLoading) return <AdminPageSkeleton />;

  if (isError || !user) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.detail.user.loadError')}
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('admin.detail.tabs.profile') },
    { id: 'roles', label: t('admin.detail.tabs.roles') },
    { id: 'accounts', label: t('admin.detail.tabs.accounts') },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="bg-linear-to-r from-diyar-dark to-[#2d524e] px-6 py-6 text-white">
          <Link
            to="/admin/users"
            className="mb-4 inline-flex text-sm font-semibold text-white/70 hover:text-white"
          >
            ← {t('admin.detail.backToUsers')}
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="lg" variant="onDark" />
              <div>
                <h1 className="text-2xl font-extrabold">{user.name}</h1>
                <p className="mt-1 text-sm text-white/70" dir="ltr">
                  {user.email ?? formatPhoneDisplay(user.phone) ?? '—'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <AdminStatusBadge status={user.status} />
                  <AdminUserRoleBadges roles={user.roles} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {isCurrentUser ? (
                <span className="rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white">
                  {t('admin.users.you')}
                </span>
              ) : user.status === 'suspended' ? (
                <PermissionGate permission="users.update">
                  <button
                    type="button"
                    disabled={activateMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmActivateUser(t, user.name);
                      if (confirmed) {
                        applyUserStatus('active');
                        activateMutation.mutate();
                      }
                    }}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.user.activate')}
                  </button>
                </PermissionGate>
              ) : (
                <PermissionGate permission="users.suspend">
                  <button
                    type="button"
                    disabled={suspendMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmSuspendUser(t, user.name);
                      if (confirmed) {
                        applyUserStatus('suspended');
                        suspendMutation.mutate();
                      }
                    }}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                  >
                    {t('admin.detail.user.suspend')}
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
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-[#f7f4f1]/60 p-4">
              <Mail className="mt-0.5 text-diyar-brown" size={18} />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t('admin.settings.email')}
                </dt>
                <dd className="mt-1 font-medium text-diyar-dark" dir="ltr">
                  {user.email ?? '—'}
                </dd>
                {user.email_verified_at ? (
                  <p className="mt-1 text-xs text-emerald-600">
                    {t('admin.detail.user.emailVerified')}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#f7f4f1]/60 p-4">
              <Phone className="mt-0.5 text-diyar-brown" size={18} />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t('admin.settings.phone')}
                </dt>
                <dd className="mt-1 font-medium text-diyar-dark" dir="ltr">
                  {formatPhoneDisplay(user.phone) ?? '—'}
                </dd>
                {user.phone_verified_at ? (
                  <p className="mt-1 text-xs text-emerald-600">
                    {t('admin.detail.user.phoneVerified')}
                  </p>
                ) : null}
              </div>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">
                {t('admin.tables.createdAt')}
              </dt>
              <dd className="mt-1 text-gray-700">
                {user.created_at ? formatLocaleDateTime(user.created_at, locale) : '—'}
              </dd>
            </div>
            {user.bio ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  {t('admin.detail.user.bio')}
                </dt>
                <dd className="mt-1 text-gray-700">{user.bio}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {activeTab === 'roles' ? (
          <div className="space-y-3">
            <AdminUserRoleBadges roles={user.roles} />
            {(user.roles ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">{t('admin.detail.user.noRoles')}</p>
            ) : null}
          </div>
        ) : null}

        {activeTab === 'accounts' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {user.vendor_account ? (
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2 text-amber-900">
                  <Store size={18} />
                  <h4 className="font-bold">{t('admin.nav.vendors')}</h4>
                </div>
                <p className="mt-2 font-semibold text-diyar-dark">
                  {user.vendor_account.store_name}
                </p>
                <p className="text-xs text-gray-500 font-mono" dir="ltr">
                  {user.vendor_account.slug}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/vendors/${user.vendor_account.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-diyar-dark px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t('admin.detail.user.openVendor')}
                  </Link>
                  <Link
                    to={`/store/${user.vendor_account.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    <ExternalLink size={14} />
                    {t('admin.viewStore')}
                  </Link>
                </div>
              </div>
            ) : null}
            {user.provider_account ? (
              <div className="rounded-xl border border-violet-200/60 bg-violet-50/50 p-4">
                <div className="flex items-center gap-2 text-violet-900">
                  <Wrench size={18} />
                  <h4 className="font-bold">{t('admin.nav.providers')}</h4>
                </div>
                <p className="mt-2 font-semibold text-diyar-dark">
                  {user.provider_account.business_name}
                </p>
                <p className="text-xs text-gray-500 font-mono" dir="ltr">
                  {user.provider_account.slug}
                </p>
                <div className="mt-3">
                  <Link
                    to={`/admin/providers/${user.provider_account.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-diyar-dark px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {t('admin.detail.user.openProvider')}
                  </Link>
                </div>
              </div>
            ) : null}
            {!user.vendor_account && !user.provider_account ? (
              <p className="text-sm text-gray-500 sm:col-span-2">
                {t('admin.detail.user.noPartnerAccounts')}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
