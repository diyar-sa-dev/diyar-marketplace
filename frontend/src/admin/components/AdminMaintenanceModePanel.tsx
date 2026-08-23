import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Construction, Globe2, MessageSquare, Power } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { adminHealthQueryKey } from '../hooks/useAdminHealth.ts';

type MaintenanceSetting = {
  group: string;
  key: string;
  full_key: string;
  effective_value: unknown;
};

type AdminMaintenanceModePanelProps = {
  settings: MaintenanceSetting[];
  canUpdate: boolean;
};

import { readBooleanFlag } from '../../lib/readBooleanFlag.ts';

function maintenanceSettingsKey(settings: MaintenanceSetting[]): string {
  return settings
    .map((setting) => `${setting.full_key}:${String(setting.effective_value ?? '')}`)
    .join('|');
}

function AdminMaintenanceModePanelForm({ settings, canUpdate }: AdminMaintenanceModePanelProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enabledSetting = settings.find(
    (s) => s.full_key === 'platform.marketplace_maintenance_enabled',
  );
  const messageAr = settings.find((s) => s.full_key === 'platform.maintenance_message_ar');
  const messageEn = settings.find((s) => s.full_key === 'platform.maintenance_message_en');

  const [enabled, setEnabled] = useState(() => readBooleanFlag(enabledSetting?.effective_value));
  const [arMessage, setArMessage] = useState(() => String(messageAr?.effective_value ?? ''));
  const [enMessage, setEnMessage] = useState(() => String(messageEn?.effective_value ?? ''));

  const saveMutation = useMutation({
    mutationFn: async (payload: { group: string; key: string; value: boolean | string }) => {
      await adminApi.patch('/admin/settings', payload);
    },
    onSuccess: () => {
      toast.success(t('admin.settings.saved'));
      void queryClient.invalidateQueries({ queryKey: adminQueryKey('settings') });
      void queryClient.invalidateQueries({ queryKey: adminHealthQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['health', 'maintenance'] });
    },
    onError: () => toast.error(t('admin.settings.saveError')),
  });

  const patchSetting = (setting: MaintenanceSetting | undefined, value: boolean | string) => {
    if (!setting || !canUpdate) return;
    saveMutation.mutate({ group: setting.group, key: setting.key, value });
  };

  const handleToggle = () => {
    if (!enabledSetting || !canUpdate) return;
    const next = !enabled;
    setEnabled(next);
    patchSetting(enabledSetting, next);
  };

  const handleSaveMessages = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canUpdate) return;

    const saves: Array<Promise<unknown>> = [];
    if (messageAr) {
      saves.push(
        adminApi.patch('/admin/settings', {
          group: messageAr.group,
          key: messageAr.key,
          value: arMessage,
        }),
      );
    }
    if (messageEn) {
      saves.push(
        adminApi.patch('/admin/settings', {
          group: messageEn.group,
          key: messageEn.key,
          value: enMessage,
        }),
      );
    }

    void Promise.all(saves)
      .then(() => {
        toast.success(t('admin.settings.saved'));
        void queryClient.invalidateQueries({ queryKey: adminQueryKey('settings') });
        void queryClient.invalidateQueries({ queryKey: adminHealthQueryKey });
        void queryClient.invalidateQueries({ queryKey: ['health', 'maintenance'] });
      })
      .catch(() => toast.error(t('admin.settings.saveError')));
  };

  return (
    <section
      className={`overflow-hidden rounded-3xl border shadow-sm transition-colors ${
        enabled
          ? 'border-amber-200 bg-linear-to-br from-amber-50 via-white to-orange-50'
          : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
              enabled ? 'bg-amber-100 text-amber-700' : 'bg-diyar-dark/5 text-diyar-dark'
            }`}
          >
            {enabled ? <Construction size={26} /> : <Globe2 size={26} />}
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-diyar-dark">
              {t('admin.settings.maintenance.title')}
            </h4>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-600">
              {t('admin.settings.maintenance.description')}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  enabled ? 'bg-amber-200/70 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                <Power size={12} />
                {enabled
                  ? t('admin.settings.maintenance.badgeOn')
                  : t('admin.settings.maintenance.badgeOff')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                {enabled
                  ? t('admin.settings.maintenance.apiBlocked')
                  : t('admin.settings.maintenance.apiLive')}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={!canUpdate || saveMutation.isPending}
          onClick={handleToggle}
          className={`relative h-12 w-19 shrink-0 rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
            enabled ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        >
          <span
            className={`absolute top-1 h-10 w-10 rounded-full bg-white shadow-md transition-transform duration-300 ${
              enabled ? 'inset-s-7' : 'inset-s-1'
            }`}
          />
          <span className="sr-only">{t('admin.settings.maintenance.toggleLabel')}</span>
        </button>
      </div>

      {enabled ? (
        <div className="border-t border-amber-100/80 bg-white/60 px-6 py-5">
          <div className="mb-4 flex items-center gap-2 text-amber-800">
            <AlertTriangle size={16} />
            <p className="text-sm font-semibold">{t('admin.settings.maintenance.messagesTitle')}</p>
          </div>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSaveMessages}>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-diyar-dark">
                <MessageSquare size={15} />
                {t('admin.settings.keys.platform_maintenance_message_ar')}
              </span>
              <textarea
                value={arMessage}
                onChange={(event) => setArMessage(event.target.value)}
                disabled={!canUpdate}
                rows={3}
                dir="rtl"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
                placeholder={t('admin.settings.maintenance.messageArPlaceholder')}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-diyar-dark">
                <MessageSquare size={15} />
                {t('admin.settings.keys.platform_maintenance_message_en')}
              </span>
              <textarea
                value={enMessage}
                onChange={(event) => setEnMessage(event.target.value)}
                disabled={!canUpdate}
                rows={3}
                dir="ltr"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-diyar-brown disabled:bg-gray-50"
                placeholder={t('admin.settings.maintenance.messageEnPlaceholder')}
              />
            </label>
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={!canUpdate || saveMutation.isPending}
                className="rounded-xl bg-diyar-dark px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {t('admin.settings.maintenance.saveMessages')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export function AdminMaintenanceModePanel(props: AdminMaintenanceModePanelProps) {
  return (
    <AdminMaintenanceModePanelForm
      key={maintenanceSettingsKey(props.settings)}
      settings={props.settings}
      canUpdate={props.canUpdate}
    />
  );
}
