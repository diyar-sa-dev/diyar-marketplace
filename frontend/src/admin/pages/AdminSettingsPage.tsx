import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { platformThemeKeys } from '../../hooks/usePlatformTheme.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminThemeSettingsPanel } from '../components/AdminThemeSettingsPanel.tsx';
import {
  localizedSettingGroup,
  localizedSettingHint,
  localizedSettingLabel,
  SETTINGS_GROUP_ORDER,
} from '../utils/localizedSetting.ts';
import { fontOptionsForSetting } from '../utils/settingFontOptions.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';

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
  booleanOnLabel,
  booleanOffLabel,
  t,
}: {
  setting: SystemSetting;
  disabled: boolean;
  defaultValue: string;
  booleanOnLabel: string;
  booleanOffLabel: string;
  t: TranslateFn;
}) {
  const fontOptions = fontOptionsForSetting(setting.full_key);

  if (fontOptions) {
    const hasCurrent = fontOptions.some((option) => option.value === defaultValue);

    return (
      <select
        name="value"
        defaultValue={hasCurrent ? defaultValue : fontOptions[0]?.value}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
        style={{ fontFamily: defaultValue }}
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
            {t(option.labelKey as never)}
          </option>
        ))}
      </select>
    );
  }
  if (setting.type === 'boolean') {
    const isOn = defaultValue === 'true' || defaultValue === '1';

    return (
      <label className="inline-flex items-center gap-3 cursor-pointer">
        <input type="hidden" name="value" value="false" />
        <input
          type="checkbox"
          name="value"
          value="true"
          defaultChecked={isOn}
          disabled={disabled}
          className="h-5 w-5 rounded border-gray-300 accent-diyar-brown"
        />
        <span className="text-sm font-medium text-gray-600">
          {isOn ? booleanOnLabel : booleanOffLabel}
        </span>
      </label>
    );
  }

  if (setting.type === 'color') {
    return (
      <div className="flex items-center gap-3">
        <input
          name="value"
          type="color"
          defaultValue={defaultValue.startsWith('#') ? defaultValue : '#947961'}
          disabled={disabled}
          className="h-10 w-16 cursor-pointer rounded-lg border border-gray-200 bg-white"
        />
        <span className="font-mono text-xs text-gray-500" dir="ltr">
          {defaultValue}
        </span>
      </div>
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
      void queryClient.invalidateQueries({ queryKey: platformThemeKeys.all });
    },
    onError: () => toast.error(t('admin.settings.saveError')),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SystemSetting[]>();
    const ignoredKeys = new Set(['theme.border_radius']);

    for (const setting of data ?? []) {
      if (ignoredKeys.has(setting.full_key)) continue;
      const list = map.get(setting.group) ?? [];
      list.push(setting);
      map.set(setting.group, list);
    }

    return SETTINGS_GROUP_ORDER.filter((group) => map.has(group)).map((group) => [
      group,
      map.get(group) ?? [],
    ] as const);
  }, [data]);

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
            {localizedSettingGroup(group, t)}
          </h3>
          {group === 'theme' ? (
            <AdminThemeSettingsPanel
              settings={settings}
              canUpdate={canUpdate}
              t={t}
              onSaved={() => toast.success(t('admin.settings.saved'))}
              onError={() => toast.error(t('admin.settings.saveError'))}
            />
          ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {settings.map((setting) => {
              const hint = localizedSettingHint(setting.full_key, t);
              const showEffective =
                setting.type !== 'boolean' &&
                setting.type !== 'color' &&
                fontOptionsForSetting(setting.full_key) === null;

              return (
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
                    {localizedSettingLabel(setting.full_key, t)}
                  </p>
                  {hint ? (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>
                  ) : null}
                  {showEffective ? (
                    <p className="mt-2 text-xs text-gray-500">
                      {t('admin.settings.effective')}: {String(setting.effective_value)}
                      {setting.has_override ? ` · ${t('admin.settings.overridden')}` : ''}
                    </p>
                  ) : setting.has_override ? (
                    <p className="mt-2 text-xs text-amber-700">{t('admin.settings.overridden')}</p>
                  ) : null}
                  <div className="mt-3">
                    <SettingControl
                      setting={setting}
                      disabled={!canUpdate}
                      defaultValue={String(setting.effective_value ?? '')}
                      booleanOnLabel={t('admin.settings.booleanOn')}
                      booleanOffLabel={t('admin.settings.booleanOff')}
                      t={t}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!canUpdate || updateMutation.isPending}
                    className="mt-3 rounded-xl bg-diyar-dark px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {t('admin.settings.saveChanges')}
                  </button>
                </form>
              );
            })}
          </div>
          )}
        </section>
      ))}
    </div>
  );
}
