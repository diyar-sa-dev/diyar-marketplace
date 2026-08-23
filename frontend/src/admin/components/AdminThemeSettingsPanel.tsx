import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client.ts';
import { platformThemeKeys } from '../../hooks/usePlatformTheme.ts';
import type { TranslateFn } from '../../lib/i18n/types.ts';
import {
  localizedSettingHint,
  localizedSettingLabel,
} from '../utils/localizedSetting.ts';
import { fontOptionsForSetting } from '../utils/settingFontOptions.ts';
import {
  detectActiveTemplate,
  THEME_COLOR_KEYS,
  THEME_COLOR_TEMPLATES,
  type ThemeColorTemplate,
} from '../utils/themeColorTemplates.ts';

type SystemSetting = {
  group: string;
  key: string;
  full_key: string;
  type: string;
  effective_value: unknown;
  has_override: boolean;
};

type AdminThemeSettingsPanelProps = {
  settings: SystemSetting[];
  canUpdate: boolean;
  t: TranslateFn;
  onSaved: () => void;
  onError: () => void;
};

function normalizeHex(value: string): string {
  return value.startsWith('#') ? value : '#947961';
}

export function AdminThemeSettingsPanel({
  settings,
  canUpdate,
  t,
  onSaved,
  onError,
}: AdminThemeSettingsPanelProps) {
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const byKey = useMemo(() => new Map(settings.map((s) => [s.key, s])), [settings]);
  const colorValues = useMemo(
    () =>
      new Map(
        THEME_COLOR_KEYS.map((key) => [
          key,
          String(byKey.get(key)?.effective_value ?? ''),
        ]),
      ),
    [byKey],
  );
  const activeTemplate = useMemo(() => detectActiveTemplate(colorValues), [colorValues]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    void queryClient.invalidateQueries({ queryKey: platformThemeKeys.all });
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: { group: string; key: string; value: string }) => {
      await adminApi.patch('/admin/settings', payload);
    },
    onSuccess: () => {
      onSaved();
      invalidate();
    },
    onError: () => onError(),
  });

  const applyTemplate = async (template: ThemeColorTemplate) => {
    if (!canUpdate) return;
    setApplyingId(template.id);
    try {
      await Promise.all(
        THEME_COLOR_KEYS.map((key) =>
          adminApi.patch('/admin/settings', {
            group: 'theme',
            key,
            value: template.colors[key],
          }),
        ),
      );
      onSaved();
      invalidate();
    } catch {
      onError();
    } finally {
      setApplyingId(null);
    }
  };

  const colorSettings = THEME_COLOR_KEYS.map((key) => byKey.get(key)).filter(Boolean) as SystemSetting[];
  const fontSettings = settings.filter((s) => fontOptionsForSetting(s.full_key) !== null);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-diyar-dark">{t('admin.settings.templates.title')}</h4>
        <p className="mt-1 text-xs text-gray-500">{t('admin.settings.templates.subtitle')}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {THEME_COLOR_TEMPLATES.map((template) => {
            const isActive = activeTemplate?.id === template.id;
            const isApplying = applyingId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                disabled={!canUpdate || isApplying || updateMutation.isPending}
                onClick={() => void applyTemplate(template)}
                className={`group relative overflow-hidden rounded-2xl border p-3 text-start transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
                  isActive
                    ? 'border-diyar-brown ring-2 ring-diyar-brown/30'
                    : 'border-gray-200 hover:border-diyar-brown/40'
                }`}
              >
                <div
                  className="h-16 rounded-xl shadow-inner"
                  style={{ background: template.gradient }}
                />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-diyar-dark">
                      {t(template.labelKey as never)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t(template.descriptionKey as never)}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="shrink-0 rounded-full bg-diyar-brown/10 px-2 py-0.5 text-[10px] font-bold text-diyar-brown">
                      {t('admin.settings.templates.active')}
                    </span>
                  ) : null}
                </div>
                <div className="mt-2 flex gap-1">
                  {THEME_COLOR_KEYS.map((key) => (
                    <span
                      key={key}
                      className="h-4 w-4 rounded-full border border-white/80 shadow-sm"
                      style={{ backgroundColor: template.colors[key] }}
                      title={key}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-diyar-dark">{t('admin.settings.templates.customTitle')}</h4>
        <p className="mt-1 text-xs text-gray-500">{t('admin.settings.templates.customSubtitle')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {colorSettings.map((setting) => {
            const hint = localizedSettingHint(setting.full_key, t);
            const defaultValue = String(setting.effective_value ?? '');

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
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl border border-gray-200 shadow-sm"
                    style={{ backgroundColor: normalizeHex(defaultValue) }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-diyar-dark">
                      {localizedSettingLabel(setting.full_key, t)}
                    </p>
                    {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    name="value"
                    type="color"
                    defaultValue={normalizeHex(defaultValue)}
                    disabled={!canUpdate}
                    className="h-10 w-full min-w-0 cursor-pointer rounded-lg border border-gray-200 bg-white"
                  />
                </div>
                {setting.has_override ? (
                  <p className="mt-2 text-xs text-amber-700">{t('admin.settings.overridden')}</p>
                ) : null}
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
      </div>

      {fontSettings.length > 0 ? (
        <div>
          <h4 className="text-sm font-bold text-diyar-dark">{t('admin.settings.templates.fontsTitle')}</h4>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {fontSettings.map((setting) => {
              const hint = localizedSettingHint(setting.full_key, t);
              const defaultValue = String(setting.effective_value ?? '');
              const fontOptions = fontOptionsForSetting(setting.full_key) ?? [];
              const hasCurrent = fontOptions.some((option) => option.value === defaultValue);

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
                  {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
                  <select
                    name="value"
                    defaultValue={hasCurrent ? defaultValue : fontOptions[0]?.value}
                    disabled={!canUpdate}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
                    style={{ fontFamily: defaultValue }}
                  >
                    {fontOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        style={{ fontFamily: option.value }}
                      >
                        {t(option.labelKey as never)}
                      </option>
                    ))}
                  </select>
                  {setting.has_override ? (
                    <p className="mt-2 text-xs text-amber-700">{t('admin.settings.overridden')}</p>
                  ) : null}
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
        </div>
      ) : null}
    </div>
  );
}
