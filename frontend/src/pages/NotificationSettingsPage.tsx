import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronLeft, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../hooks/auth/useAuth.ts';
import { resolveAccountHubPath, resolveNotificationsHubPath } from '../lib/auth/roles.ts';
import { useLocale } from '../hooks/useLocale.ts';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '../hooks/profile/useNotificationPreferences.ts';
import { useToast } from '../hooks/useToast.ts';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { NotificationCategorySettingsGrid } from '../components/notifications/NotificationCategorySettingsGrid.tsx';
import { NotificationToggle } from '../components/notifications/NotificationToggle.tsx';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const notificationsHubPath = resolveNotificationsHubPath(user?.roles);
  const settingsQuery = useNotificationPreferences();
  const updateSettings = useUpdateNotificationPreferences();
  const { toast } = useToast();

  const handleGlobalChannelToggle = async (channel: 'email' | 'push', nextValue: boolean) => {
    try {
      await updateSettings.mutateAsync({ channels: { [channel]: nextValue } });
      toast.success(t('notifications.settingsSaved'));
    } catch {
      toast.error(t('notifications.settingsSaveError'));
    }
  };

  const handleCategoryToggle = async (categoryKey: string, nextValue: boolean) => {
    try {
      await updateSettings.mutateAsync({
        category_enabled: { [categoryKey]: nextValue },
      });
      toast.success(t('notifications.settingsSaved'));
    } catch {
      toast.error(t('notifications.settingsSaveError'));
    }
  };

  const settings = settingsQuery.data;

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.home')}
            </Link>
            <ChevronLeft size={16} />
            <Link to={accountHubPath} className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <ChevronLeft size={16} />
            <Link to={notificationsHubPath} className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.notifications')}
            </Link>
            <ChevronLeft size={16} />
            <span className="font-bold text-diyar-dark">{t('notifications.settingsTitle')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-2 flex items-center gap-2">
            <Bell size={24} className="text-diyar-brown" />
            {t('notifications.settingsTitle')}
          </h1>
          <p className="text-gray-500 text-sm">{t('notifications.settingsSubtitle')}</p>
        </div>

        {settingsQuery.isLoading ? (
          <LoadingState message={t('notifications.settingsLoading')} />
        ) : settingsQuery.isError || !settings ? (
          <ErrorState
            message={t('notifications.settingsLoadError')}
            onRetry={() => void settingsQuery.refetch()}
          />
        ) : (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-gray-100 bg-linear-to-r from-gray-50/80 to-white">
                <h2 className="font-bold text-lg text-diyar-dark">{t('notifications.channelsTitle')}</h2>
                <p className="text-xs text-gray-500 mt-1">{t('notifications.channelsSubtitle')}</p>
              </div>

              <div className="divide-y divide-gray-50">
                <ChannelSettingRow
                  icon={<Bell size={18} />}
                  title={t('notifications.channelPushTitle')}
                  description={t('notifications.channelPushDescription')}
                  checked={settings.channels.push}
                  onToggle={() => void handleGlobalChannelToggle('push', !settings.channels.push)}
                />
                <ChannelSettingRow
                  icon={<Mail size={18} />}
                  title={t('notifications.channelEmailTitle')}
                  description={t('notifications.channelEmailDescription')}
                  checked={settings.channels.email}
                  onToggle={() => void handleGlobalChannelToggle('email', !settings.channels.email)}
                />
                <ChannelSettingRow
                  icon={<Smartphone size={18} />}
                  title={t('notifications.channelSmsTitle')}
                  description={t('notifications.channelSmsDescription')}
                  checked={false}
                  disabled
                  unavailableLabel={t('notifications.channelSmsUnavailable')}
                />
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-gray-100 bg-linear-to-r from-amber-50/40 to-white">
                <h2 className="font-bold text-lg text-diyar-dark">{t('notifications.typesTitle')}</h2>
                <p className="text-xs text-gray-500 mt-1">{t('notifications.typesSubtitle')}</p>
              </div>

              <NotificationCategorySettingsGrid
                t={t}
                categories={settings.categories}
                categoryEnabled={settings.category_enabled}
                onToggle={(key, next) => void handleCategoryToggle(key, next)}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function ChannelSettingRow({
  icon,
  title,
  description,
  checked,
  onToggle,
  disabled = false,
  unavailableLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  unavailableLabel?: string;
}) {
  return (
    <div className="p-5 md:p-6 flex items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-gray-800 mb-1">{title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      {unavailableLabel ? (
        <span className="text-xs text-amber-700 font-bold shrink-0 bg-amber-50 px-2.5 py-1 rounded-full">
          {unavailableLabel}
        </span>
      ) : (
        <NotificationToggle checked={checked} label={title} onChange={() => onToggle?.()} disabled={disabled} />
      )}
    </div>
  );
}
