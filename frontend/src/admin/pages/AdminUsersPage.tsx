import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, UserX, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { AdminUserRoleBadges } from '../components/AdminRoleBadge.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';

type AdminUser = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string;
  avatar_url?: string | null;
  roles?: Array<{ name: string; label: string }>;
};

export default function AdminUsersPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
  } = useAdminListQuery<AdminUser>({
    resourceKey: 'admin-users',
    endpoint: '/admin/users',
    itemsKey: 'users',
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: 'suspend' | 'activate' }) => {
      await adminApi.post(`/admin/users/${userId}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.users.updated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error(t('admin.users.updateError')),
  });

  const users = data?.items ?? [];
  const meta = data?.meta;

  return (
    <AdminResourceTable
      title={t('admin.nav.users')}
      subtitle={t('admin.users.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchUsers')}
      filters={
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
        >
          <option value="">{t('admin.tables.allStatuses')}</option>
          <option value="active">{t('admin.tables.active')}</option>
          <option value="pending">{t('admin.tables.pending')}</option>
          <option value="suspended">{t('admin.tables.suspended')}</option>
        </select>
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={users.length === 0}
      emptyTitle={t('admin.users.empty')}
      columns={
        <tr>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.user')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.roles')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.contact')}</th>
          <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
          <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
        </tr>
      }
      footer={
        <AdminTablePagination
          meta={meta}
          page={page}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      }
    >
      {users.map((user) => (
        <tr key={user.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="sm" />
              <span className="font-semibold text-diyar-dark">{user.name}</span>
            </div>
          </td>
          <td className="px-4 py-3">
            <AdminUserRoleBadges roles={user.roles} />
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">
            <div className="space-y-0.5">
              {user.email ? <p dir="ltr">{user.email}</p> : null}
              {user.phone ? <p dir="ltr">{user.phone}</p> : null}
              {!user.email && !user.phone ? '—' : null}
            </div>
          </td>
          <td className="px-4 py-3">
            {user.status ? <AdminStatusBadge status={user.status} /> : '—'}
          </td>
          <td className="px-4 py-3">
            <div className="flex justify-end gap-1">
              <Link
                to={`/admin/users/${user.id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                aria-label={t('admin.tables.view')}
              >
                <Eye size={14} />
              </Link>
              {user.status === 'suspended' ? (
                <PermissionGate permission="users.update">
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ userId: user.id, action: 'activate' })}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 cursor-pointer"
                  >
                    <UserCheck size={14} />
                    <span className="hidden sm:inline">{t('admin.users.activate')}</span>
                  </button>
                </PermissionGate>
              ) : (
                <PermissionGate permission="users.suspend">
                  <button
                    type="button"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t('admin.users.suspendConfirm'))) {
                        statusMutation.mutate({ userId: user.id, action: 'suspend' });
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 cursor-pointer"
                  >
                    <UserX size={14} />
                    <span className="hidden sm:inline">{t('admin.users.suspend')}</span>
                  </button>
                </PermissionGate>
              )}
            </div>
          </td>
        </tr>
      ))}
    </AdminResourceTable>
  );
}
