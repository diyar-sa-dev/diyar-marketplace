import {
  Grid,
  Home,
  Phone,
  Info,
  Sparkles,
  FolderGit2,
  Wrench,
  Layers,
  LayoutDashboard,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ADMIN_PANEL_PATH } from '../../../lib/auth/roles.ts';

type SidebarDrawerNavProps = {
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
};

export function SidebarDrawerNav({
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
}: SidebarDrawerNavProps) {
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-1">
        <h3 className="font-bold text-gray-400 mb-2 px-3 text-[11px]">
          {t('layout.sidebar.browseSection')}
        </h3>

        <button
          onClick={() => handleNavigate('/')}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Home
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.home')}
          </span>
        </button>

        {showDashboardLink && (
          <button
            onClick={() => handleNavigate(dashboardPath)}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
          >
            <LayoutDashboard
              size={18}
              className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
            />
            <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
              {t('layout.sidebar.dashboard')}
            </span>
          </button>
        )}

        {showAdminPanelLink && (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate(ADMIN_PANEL_PATH);
            }}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-start group animate-in slide-in-from-right duration-75 cursor-pointer"
          >
            <LayoutDashboard
              size={18}
              className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
            />
            <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
              {t('layout.nav.adminPanel')}
            </span>
          </button>
        )}

        {isAuthenticated && (
          <button
            onClick={() => handleNavigate(accountHubPath)}
            className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
          >
            <User
              size={18}
              className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
            />
            <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
              {t('layout.sidebar.myAccount')}
            </span>
          </button>
        )}

        <button
          onClick={() => handleNavigate('/services')}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Wrench
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.services')}
          </span>
        </button>

        <button
          onClick={() => handleNavigate('/b2b')}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Layers
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.b2b')}
          </span>
        </button>

        <button
          onClick={() => handleNavigate('/ai-designer')}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Sparkles
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.personalAssistant')}
          </span>
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="font-bold text-gray-400 mb-2 px-3 text-[11px]">
          {t('layout.sidebar.quickAccess')}
        </h3>

        <button
          onClick={() => handleNavigate('/category/all')}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Grid
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.products')}
          </span>
        </button>

        <button
          onClick={onOpenProjects}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <FolderGit2
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.projects')}
          </span>
        </button>

        <button
          onClick={onOpenAiStudio}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Sparkles
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.designStudio')}
          </span>
        </button>

        <button
          onClick={() => openAboutModal()}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-start group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Info
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.about')}
          </span>
        </button>

        <button
          onClick={onOpenContact}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-all text-right group animate-in slide-in-from-right duration-75 cursor-pointer"
        >
          <Phone
            size={18}
            className="text-gray-400 group-hover:text-diyar-brown shrink-0 transition-colors"
          />
          <span className="font-bold text-sm text-diyar-dark group-hover:text-diyar-brown transition-colors">
            {t('layout.sidebar.contact')}
          </span>
        </button>
      </div>
    </>
  );
}
