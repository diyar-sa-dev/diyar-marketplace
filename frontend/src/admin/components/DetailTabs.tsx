type DetailTab = {
  id: string;
  label: string;
};

type DetailTabsProps = {
  tabs: DetailTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
};

export function DetailTabs({ tabs, activeTab, onChange }: DetailTabsProps) {
  return (
    <div className="border-b border-gray-100">
      <div className="-mb-px flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'border-diyar-dark text-diyar-dark'
                  : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
