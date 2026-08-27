import type { SettingsTab } from './vendorSettings.types.ts';

type VendorSettingsTabsProps = {
  tabs: Array<{ id: SettingsTab; label: string }>;
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
};

export function VendorSettingsTabs({ tabs, activeTab, onSelectTab }: VendorSettingsTabsProps) {
  return (
    <div className="flex gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl overflow-x-auto scrollbar-hide border border-gray-100">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelectTab(tab.id)}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer shrink-0 ${
            activeTab === tab.id
              ? 'bg-white text-diyar-brown shadow-sm ring-1 ring-gray-200/80'
              : 'text-gray-500 hover:text-diyar-dark hover:bg-white/60'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
