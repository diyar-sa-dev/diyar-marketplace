import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminPermission } from '../hooks/useAdminPermission.ts';

type Permission = { id: string; key: string; group: string; label: string };
type Role = { id: string; name: string; label: string; permissions: Permission[] };

export default function AdminRolesPage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canManage = useAdminPermission('roles.manage');

  const rolesQuery = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await adminApi.get<ApiSuccessResponse<{ roles: Role[] }>>('/admin/roles');
      return response.data.data.roles;
    },
  });

  const permissionsQuery = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response =
        await adminApi.get<ApiSuccessResponse<{ permissions: Permission[] }>>('/admin/permissions');
      return response.data.data.permissions;
    },
  });

  const role = rolesQuery.data?.[0];
  const rolePermissionKeys = useMemo(
    () => role?.permissions.map((permission) => permission.key) ?? [],
    [role],
  );
  const [selectedKeysOverride, setSelectedKeysOverride] = useState<string[] | null>(null);
  const selectedKeys = selectedKeysOverride ?? rolePermissionKeys;

  const updateSelectedKeys = (updater: string[] | ((current: string[]) => string[])) => {
    setSelectedKeysOverride((override) => {
      const current = override ?? rolePermissionKeys;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  };

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, Permission[]>();

    for (const permission of permissionsQuery.data ?? []) {
      const list = groups.get(permission.group) ?? [];
      list.push(permission);
      groups.set(permission.group, list);
    }

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [permissionsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (permissions: string[]) => {
      if (!role) {
        return;
      }

      await adminApi.put(`/admin/roles/${role.id}/permissions`, { permissions });
    },
    onSuccess: async () => {
      showToast(t('admin.roles.saved'), 'success');
      setSelectedKeysOverride(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: () => {
      showToast(t('admin.roles.saveError'), 'error');
    },
  });

  if (rolesQuery.isLoading || permissionsQuery.isLoading) {
    return <AdminPageSkeleton />;
  }

  if (rolesQuery.isError || permissionsQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.roles.loadError')}
      </div>
    );
  }

  if (!role) {
    return <p className="text-sm text-gray-500">{t('admin.roles.empty')}</p>;
  }

  const togglePermission = (key: string) => {
    if (!canManage) {
      return;
    }

    updateSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.nav.roles')}</h2>
          <p className="mt-1 text-sm text-gray-500">{t('admin.roles.subtitle')}</p>
        </div>
        <PermissionGate permission="roles.manage">
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate(selectedKeys)}
            className="rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16302d] disabled:opacity-50 cursor-pointer"
          >
            {t('admin.roles.save')}
          </button>
        </PermissionGate>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-diyar-dark">{role.label}</h3>
        <p className="mt-1 text-sm text-gray-500">{role.name}</p>
      </div>

      <div className="space-y-4">
        {groupedPermissions.map(([group, permissions]) => (
          <section
            key={group}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
              {group}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {permissions.map((permission) => {
                const checked = selectedKeys.includes(permission.key);

                return (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                      checked ? 'border-diyar-brown/30 bg-[#f7f4f1]' : 'border-gray-100'
                    } ${canManage ? 'cursor-pointer' : 'cursor-default opacity-90'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!canManage}
                      onChange={() => togglePermission(permission.key)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-semibold text-diyar-dark">{permission.key}</span>
                      <span className="block text-xs text-gray-500">{permission.label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
