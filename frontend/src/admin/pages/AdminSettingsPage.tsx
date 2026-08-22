import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';

type SystemSetting = {
  group: string;
  key: string;
  full_key: string;
  type: string;
  effective_value: unknown;
  stored_value: unknown;
  has_override: boolean;
};

function SettingControl({
  setting,
  disabled,
  defaultValue,
}: {
  setting: SystemSetting;
  disabled: boolean;
  defaultValue: string;
}) {
  if (setting.type === 'boolean') {
    return (
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <input type="hidden" name="value" value="false" />
        <input
          type="checkbox"
          name="value"
          value="true"
          defaultChecked={defaultValue === 'true' || defaultValue === '1'}
          disabled={disabled}
          className="h-5 w-5 rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">{defaultValue === 'true' ? 'On' : 'Off'}</span>
      </label>
    );
  }

  if (setting.type === 'color') {
    return (
      <input
        name="value"
        type="color"
        defaultValue={defaultValue.startsWith('#') ? defaultValue : '#947961'}
        disabled={disabled}
        className="h-10 w-16 cursor-pointer rounded-lg border border-gray-200 bg-white"
      />
    );
  }

  if (setting.type === 'integer' || setting.type === 'decimal') {
    return (
      <input
        name="value"
        type="number"
        step={setting.type === 'decimal' ? '0.01' : '1'}
        defaultValue={defaultValue}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
      />
    );
  }

  return (
    <input
      name="value"
      type="text"
      defaultValue={defaultValue}
      disabled={disabled}
      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
    />
  );
}

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user, hasPermission } = useAdminAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission('settings.update');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response =
        await adminApi.get<ApiSuccessResponse<{ settings: SystemSetting[] }>>('/admin/settings');
      return response.data.data.settings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { group: string; key: string; value: string }) => {
      await adminApi.patch('/admin/settings', payload);
    },
    onSuccess: () => {
      toast.success(t('admin.settings.saved'));
      void queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => toast.error(t('admin.settings.saveError')),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SystemSetting[]>();
    for (const setting of data ?? []) {
      const list = map.get(setting.group) ?? [];
      list.push(setting);
      map.set(setting.group, list);
    }
    return Array.from(map.entries());
  }, [data]);

  const settingLabel = (fullKey: string) => {
    const key = `admin.settings.keys.${fullKey.replace(/\./g, '_')}`;
    const translated = t(key as never);
    return translated === key ? fullKey.split('.').slice(1).join(' · ') : translated;
  };

  if (isLoading) {
    return <AdminPageSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
        {t('admin.settings.loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.nav.settings')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.settings.subtitle')}</p>
      </div>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-diyar-dark">{t('admin.settings.accountTitle')}</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl bg-[#f7f4f1]/70 p-4">
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="lg" />
            <div>
              <p className="font-bold text-diyar-dark">{user?.name}</p>
              <p className="text-sm text-gray-500">{t('admin.identityLabel')}</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.settings.email')}
              </dt>
              <dd className="mt-1 text-gray-700" dir="ltr">
                {user?.email ?? '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t('admin.settings.phone')}
              </dt>
              <dd className="mt-1 text-gray-700" dir="ltr">
                {user?.phone ?? '—'}
              </dd>
            </div>
          </dl>
        </div>
        <p className="mt-4 text-xs text-gray-500">{t('admin.settings.accountHint')}</p>
      </section>

      {grouped.map(([group, settings]) => (
        <section key={group} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-diyar-dark">
            {(() => {
              const key = `admin.settings.groups.${group}`;
              const translated = t(key as never);
              return translated === key ? group : translated;
            })()}
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {settings.map((setting) => (
              <form
                key={setting.full_key}
                className="rounded-2xl border border-gray-100 bg-[#f7f4f1]/30 p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!canUpdate) return;
                  const formData = new FormData(event.currentTarget);
                  const raw = formData.get('value');
                  updateMutation.mutate({
                    group: setting.group,
                    key: setting.key,
                    value: raw instanceof File ? '' : String(raw ?? ''),
                  });
                }}
              >
                <p className="text-sm font-bold text-diyar-dark">
                  {settingLabel(setting.full_key)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {t('admin.settings.effective')}: {String(setting.effective_value)}
                  {setting.has_override ? ` · ${t('admin.settings.overridden')}` : ''}
                </p>
                <div className="mt-3">
                  <SettingControl
                    setting={setting}
                    disabled={!canUpdate}
                    defaultValue={String(setting.effective_value ?? '')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canUpdate || updateMutation.isPending}
                  className="mt-3 rounded-xl bg-diyar-dark px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  {t('common.save')}
                </button>
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
