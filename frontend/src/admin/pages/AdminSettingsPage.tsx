import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Shield, UserCircle2 } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useAdminAuth } from '../auth/AdminAuthContext.tsx';
import { UserAvatar } from '../../components/profile/UserAvatar.tsx';
import { platformThemeKeys } from '../../hooks/usePlatformTheme.ts';
import { platformCommerceKeys } from '../../hooks/usePlatformCommerce.ts';
import { platformSearchKeys } from '../../hooks/usePlatformSearch.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import { AdminPageSkeleton } from '../components/AdminPageSkeleton.tsx';
import { AdminSettingFieldCard } from '../components/AdminSettingFieldCard.tsx';
import {
  AdminSettingsBooleanGrid,
  AdminSettingsFieldGrid,
  AdminSettingsGroupSection,
  groupDescription,
} from '../components/AdminSettingsGroupSection.tsx';
import { AdminThemeSettingsPanel } from '../components/AdminThemeSettingsPanel.tsx';
import { AdminMaintenanceModePanel } from '../components/AdminMaintenanceModePanel.tsx';
import { AdminPlatformHealthPanel } from '../components/AdminPlatformHealthPanel.tsx';
import { isMaintenanceSetting } from '../utils/maintenanceSettings.ts';
import { isHiddenAdminSetting } from '../utils/hiddenAdminSettings.ts';
import {
  localizedSettingGroup,
  localizedSettingHint,
  localizedSettingLabel,
  SETTINGS_GROUP_ORDER,
} from '../utils/localizedSetting.ts';
import { settingGroupMeta } from '../utils/settingGroupMeta.ts';

type SystemSetting = {
  group: string;
  key: string;
  full_key: string;
  type: string;
  effective_value: unknown;
  stored_value: unknown;
  has_override: boolean;
};

function partitionSettings(settings: SystemSetting[]) {
  const booleans: SystemSetting[] = [];
  const others: SystemSetting[] = [];

  for (const setting of settings) {
    if (setting.type === 'boolean') {
      booleans.push(setting);
    } else {
      others.push(setting);
    }
  }

  return { booleans, others };
}

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user, hasPermission } = useAdminAuth();
  const queryClient = useQueryClient();
  const canUpdate = hasPermission('settings.update');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: adminQueryKey('settings'),
    queryFn: async () => {
      const response =
        await adminApi.get<ApiSuccessResponse<{ settings: SystemSetting[] }>>('/admin/settings');
      return response.data.data.settings;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: { group: string; key: string; value: string }) => {
      setSavingKey(`${payload.group}.${payload.key}`);
      await adminApi.patch('/admin/settings', payload);
    },
    onSuccess: () => {
      toast.success(t('admin.settings.saved'));
      void queryClient.invalidateQueries({ queryKey: adminQueryKey('settings') });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'health', 'summary'] });
      void queryClient.invalidateQueries({ queryKey: ['health', 'maintenance'] });
      void queryClient.invalidateQueries({ queryKey: platformThemeKeys.all });
      void queryClient.invalidateQueries({ queryKey: platformCommerceKeys.all });
      void queryClient.invalidateQueries({ queryKey: platformSearchKeys.all });
    },
    onError: () => toast.error(t('admin.settings.saveError')),
    onSettled: () => setSavingKey(null),
  });

  const grouped = useMemo(() => {
    const map = new Map<string, SystemSetting[]>();
    const ignoredKeys = new Set(['theme.border_radius']);

    for (const setting of data ?? []) {
      if (ignoredKeys.has(setting.full_key) || isHiddenAdminSetting(setting.full_key)) continue;
      const list = map.get(setting.group) ?? [];
      list.push(setting);
      map.set(setting.group, list);
    }

    return SETTINGS_GROUP_ORDER.filter((group) => map.has(group)).map(
      (group) => [group, map.get(group) ?? []] as const,
    );
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
    <div className="space-y-6 pb-8 sm:space-y-8">
      <header className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-diyar-dark sm:text-2xl">
          {t('admin.nav.settings')}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-gray-500">{t('admin.settings.subtitle')}</p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-linear-to-r from-[#faf8f5] to-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-diyar-dark/8 text-diyar-dark sm:h-11 sm:w-11">
              <UserCircle2 size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-diyar-dark sm:text-lg">
                {t('admin.settings.accountTitle')}
              </h3>
              <p className="text-xs text-gray-500">{t('admin.settings.accountHint')}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-gray-100 bg-[#faf8f5]/60 p-4 sm:p-5">
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="lg" />
            <div>
              <p className="font-bold text-diyar-dark">{user?.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                <Shield size={12} />
                {t('admin.identityLabel')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <Mail size={13} />
                {t('admin.settings.email')}
              </dt>
              <dd className="mt-2 truncate text-sm font-medium text-gray-800" dir="ltr">
                {user?.email ?? '—'}
              </dd>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4">
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                <Phone size={13} />
                {t('admin.settings.phone')}
              </dt>
              <dd className="mt-2 text-sm font-medium text-gray-800" dir="ltr">
                {user?.phone ?? '—'}
              </dd>
            </div>
          </div>
        </div>
      </section>

      {grouped.map(([group, settings]) => {
        const meta = settingGroupMeta(group);
        const visibleSettings = settings.filter((setting) =>
          group === 'platform' ? !isMaintenanceSetting(setting.full_key) : true,
        );
        const { booleans, others } = partitionSettings(visibleSettings);
        const Icon = meta.icon;
        const description = groupDescription(group, t);

        return (
          <div key={group} className="space-y-4">
            {group === 'platform' ? (
              <>
                <AdminPlatformHealthPanel />
                <AdminMaintenanceModePanel
                  settings={settings.filter((setting) => isMaintenanceSetting(setting.full_key))}
                  canUpdate={canUpdate}
                />
              </>
            ) : null}

            <AdminSettingsGroupSection
              title={localizedSettingGroup(group, t)}
              description={description}
              icon={Icon}
              accentClass={meta.accentClass}
              count={visibleSettings.length}
              countLabel={t('admin.settings.fieldsCount')}
            >
              {group === 'theme' ? (
                <AdminThemeSettingsPanel
                  settings={settings}
                  canUpdate={canUpdate}
                  t={t}
                  onSaved={() => toast.success(t('admin.settings.saved'))}
                  onError={() => toast.error(t('admin.settings.saveError'))}
                />
              ) : visibleSettings.length === 0 ? (
                <p className="text-sm text-gray-500">{t('admin.settings.emptyGroup')}</p>
              ) : (
                <div className="space-y-6">
                  {booleans.length > 0 ? (
                    <div>
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                        {t('admin.settings.togglesSection')}
                      </p>
                      <AdminSettingsBooleanGrid>
                        {booleans.map((setting) => (
                          <AdminSettingFieldCard
                            key={setting.full_key}
                            setting={setting}
                            label={localizedSettingLabel(setting.full_key, t)}
                            hint={localizedSettingHint(setting.full_key, t)}
                            disabled={!canUpdate}
                            isSaving={savingKey === setting.full_key}
                            booleanOnLabel={t('admin.settings.booleanOn')}
                            booleanOffLabel={t('admin.settings.booleanOff')}
                            effectiveLabel={t('admin.settings.effective')}
                            overriddenLabel={t('admin.settings.overridden')}
                            saveLabel={t('admin.settings.saveChanges')}
                            t={t}
                            onSave={(value) =>
                              updateMutation.mutate({
                                group: setting.group,
                                key: setting.key,
                                value,
                              })
                            }
                          />
                        ))}
                      </AdminSettingsBooleanGrid>
                    </div>
                  ) : null}

                  {others.length > 0 ? (
                    <div>
                      {booleans.length > 0 ? (
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                          {t('admin.settings.valuesSection')}
                        </p>
                      ) : null}
                      <AdminSettingsFieldGrid>
                        {others.map((setting) => (
                          <AdminSettingFieldCard
                            key={setting.full_key}
                            setting={setting}
                            label={localizedSettingLabel(setting.full_key, t)}
                            hint={localizedSettingHint(setting.full_key, t)}
                            disabled={!canUpdate}
                            isSaving={savingKey === setting.full_key}
                            booleanOnLabel={t('admin.settings.booleanOn')}
                            booleanOffLabel={t('admin.settings.booleanOff')}
                            effectiveLabel={t('admin.settings.effective')}
                            overriddenLabel={t('admin.settings.overridden')}
                            saveLabel={t('admin.settings.saveChanges')}
                            t={t}
                            onSave={(value) =>
                              updateMutation.mutate({
                                group: setting.group,
                                key: setting.key,
                                value,
                              })
                            }
                          />
                        ))}
                      </AdminSettingsFieldGrid>
                    </div>
                  ) : null}
                </div>
              )}
            </AdminSettingsGroupSection>
          </div>
        );
      })}
    </div>
  );
}
