import { VendorReturnPolicyPanel } from '../../../components/dashboard/vendor/returns/VendorReturnPolicyPanel.tsx';
import { VendorShippingSettingsPanel } from '../../../components/dashboard/vendor/shipping/VendorShippingSettingsPanel.tsx';
import { PageLoadingOverlay } from '../../../components/common/PageLoadingOverlay.tsx';
import { LoadingState } from '../../../components/common/LoadingState.tsx';
import { ErrorState } from '../../../components/common/ErrorState.tsx';
import { useVendorSettingsPage } from './useVendorSettingsPage.ts';
import { VendorSettingsTabs } from './VendorSettingsTabs.tsx';
import { AccountSettingsSection } from './sections/AccountSettingsSection.tsx';
import { AppearanceSettingsSection } from './sections/AppearanceSettingsSection.tsx';
import { BusinessSettingsSection } from './sections/BusinessSettingsSection.tsx';
import { NotificationsSettingsSection } from './sections/NotificationsSettingsSection.tsx';
import { StoreSettingsSection } from './sections/StoreSettingsSection.tsx';

export default function VendorSettingsPage() {
  const page = useVendorSettingsPage();
  const {
    t,
    settings,
    isLoading,
    isError,
    error,
    refetch,
    activeTab,
    selectTab,
    tabs,
    showMediaOverlay,
  } = page;

  if (isLoading) {
    return (
      <div className="relative min-h-96">
        <LoadingState className="min-h-96" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <ErrorState
        error={error}
        title={t('vendor.settings.loadError')}
        onRetry={() => void refetch()}
        className="min-h-96"
      />
    );
  }

  return (
    <div className="w-full space-y-6 relative">
      {showMediaOverlay && <PageLoadingOverlay />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.settings.title')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('vendor.settings.subtitle')}</p>
        </div>
      </div>

      <VendorSettingsTabs tabs={tabs} activeTab={activeTab} onSelectTab={selectTab} />

      <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm w-full">
        {activeTab === 'store' && <StoreSettingsSection {...page} />}
        {activeTab === 'appearance' && <AppearanceSettingsSection {...page} />}
        {activeTab === 'business' && <BusinessSettingsSection {...page} />}
        {activeTab === 'shipping' && (
          <div className="animate-in fade-in duration-300">
            <VendorShippingSettingsPanel />
          </div>
        )}
        {activeTab === 'returns' && (
          <div className="animate-in fade-in duration-300">
            <VendorReturnPolicyPanel />
          </div>
        )}
        {activeTab === 'account' && <AccountSettingsSection {...page} />}
        {activeTab === 'notifications' && <NotificationsSettingsSection {...page} />}
      </div>
    </div>
  );
}
