import { Save } from 'lucide-react';
import type { Locale } from '../../../../lib/i18n/types.ts';
import { RequiredLabel } from '../../../../components/dashboard/vendor/RequiredLabel.tsx';
import { INPUT_CLASS } from '../vendorSettings.types.ts';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type NotificationsSettingsSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'notificationsForm'
  | 'patchNotificationsForm'
  | 'isSavingNotifications'
  | 'handleSaveNotifications'
>;

export function NotificationsSettingsSection({
  t,
  notificationsForm,
  patchNotificationsForm,
  isSavingNotifications,
  handleSaveNotifications,
}: NotificationsSettingsSectionProps) {
  const { selectedLanguage, emailNotifications } = notificationsForm;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="font-bold text-diyar-dark mb-6">
          {t('vendor.settings.notifications.title')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
            <div>
              <h4 className="font-bold text-diyar-dark">
                {t('vendor.settings.notifications.emailChannel.title')}
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                {t('vendor.settings.notifications.emailChannel.desc')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={emailNotifications}
                onChange={() => patchNotificationsForm({ emailNotifications: !emailNotifications })}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown" />
            </label>
          </div>

          {(['newOrders', 'stock', 'messages', 'reports'] as const).map((key, index) => (
            <div
              key={key}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
            >
              <div>
                <h4 className="font-bold text-diyar-dark">
                  {t(`vendor.settings.notifications.items.${key}.title`)}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {t(`vendor.settings.notifications.items.${key}.desc`)}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={index !== 3}
                  readOnly
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h3 className="font-bold text-diyar-dark mb-4">
          {t('vendor.settings.notifications.languageTitle')}
        </h3>
        <div className="w-full md:w-1/2 space-y-2">
          <RequiredLabel className="text-sm font-bold text-gray-700">
            {t('vendor.settings.notifications.dashboardLanguage')}
          </RequiredLabel>
          <select
            value={selectedLanguage}
            onChange={(event) =>
              patchNotificationsForm({ selectedLanguage: event.target.value as Locale })
            }
            className={`${INPUT_CLASS} appearance-none`}
          >
            <option value="ar">{t('language.options.ar')}</option>
            <option value="en">{t('language.options.en')}</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => void handleSaveNotifications()}
          disabled={isSavingNotifications}
          className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60"
        >
          <Save size={18} />
          {isSavingNotifications ? t('vendor.settings.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
