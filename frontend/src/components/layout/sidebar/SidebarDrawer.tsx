import { X } from 'lucide-react';
import { SidebarDrawerNav } from './SidebarDrawerNav.tsx';
import { SidebarDrawerCategories, type BrowseCategory } from './SidebarDrawerCategories.tsx';

type SidebarDrawerProps = {
  dir: 'ltr' | 'rtl';
  t: (key: string, params?: Record<string, string>) => string;
  onClose: () => void;
  handleNavigate: (path: string) => void;
  showDashboardLink: boolean;
  showAdminPanelLink: boolean;
  dashboardPath: string;
  accountHubPath: string;
  isAuthenticated: boolean;
  openAboutModal: () => void;
  onOpenProjects: () => void;
  onOpenAiStudio: () => void;
  onOpenContact: () => void;
  showCategoriesSection: boolean;
  setShowCategoriesSection: (value: boolean) => void;
  categoriesLoading: boolean;
  browseCategories: BrowseCategory[];
  openCategory: string | null;
  setOpenCategory: (slug: string | null) => void;
};

export function SidebarDrawer({
  dir,
  t,
  onClose,
  handleNavigate,
  showDashboardLink,
  showAdminPanelLink,
  dashboardPath,
  accountHubPath,
  isAuthenticated,
  openAboutModal,
  onOpenProjects,
  onOpenAiStudio,
  onOpenContact,
  showCategoriesSection,
  setShowCategoriesSection,
  categoriesLoading,
  browseCategories,
  openCategory,
  setOpenCategory,
}: SidebarDrawerProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`fixed top-0 h-full w-[320px] md:w-95 bg-white z-60 shadow-2xl flex flex-col duration-300 pointer-events-auto animate-in ${
          dir === 'rtl' ? 'right-0 slide-in-from-right-full' : 'left-0 slide-in-from-left-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <img src="/logo_diyar.svg" alt="DIYAR" className="h-9" />
            <div>
              <h2 className="font-bold text-base text-diyar-dark leading-snug">
                {t('layout.sidebar.brandTitle')}
              </h2>
              <p className="text-[10px] text-gray-500 font-semibold">
                {t('layout.sidebar.brandTagline')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-diyar-dark hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-hide space-y-6">
          <SidebarDrawerNav
            t={t}
            onClose={onClose}
            handleNavigate={handleNavigate}
            showDashboardLink={showDashboardLink}
            showAdminPanelLink={showAdminPanelLink}
            dashboardPath={dashboardPath}
            accountHubPath={accountHubPath}
            isAuthenticated={isAuthenticated}
            openAboutModal={openAboutModal}
            onOpenProjects={onOpenProjects}
            onOpenAiStudio={onOpenAiStudio}
            onOpenContact={onOpenContact}
          />

          <SidebarDrawerCategories
            t={t}
            handleNavigate={handleNavigate}
            showCategoriesSection={showCategoriesSection}
            setShowCategoriesSection={setShowCategoriesSection}
            categoriesLoading={categoriesLoading}
            browseCategories={browseCategories}
            openCategory={openCategory}
            setOpenCategory={setOpenCategory}
          />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-center">
          <p className="text-[10px] text-gray-400 font-medium">{t('layout.sidebar.footer')}</p>
        </div>
      </div>
    </>
  );
}
