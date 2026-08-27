import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useAboutModal } from '../../context/AboutModalContext.tsx';
import { useCategories } from '../../hooks/catalog/useCatalog.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  shouldShowStorefrontDashboardLink,
  shouldShowAdminPanelLink,
  resolveAccountHubPath,
  resolveDashboardEntryPath,
} from '../../lib/auth/roles.ts';
import { CATEGORIES } from './sidebar/sidebarMenuConstants.ts';
import { SidebarDrawer } from './sidebar/SidebarDrawer.tsx';
import { SidebarProjectsModal } from './sidebar/SidebarProjectsModal.tsx';
import { SidebarAiStudioModal } from './sidebar/SidebarAiStudioModal.tsx';
import { SidebarContactModal } from './sidebar/SidebarContactModal.tsx';

export function SidebarMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, dir } = useLocale();
  const { openAboutModal } = useAboutModal();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [showCategoriesSection, setShowCategoriesSection] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories('product');
  const dashboardPath = resolveDashboardEntryPath(user?.roles);
  const accountHubPath = resolveAccountHubPath(user?.roles);
  const showDashboardLink = shouldShowStorefrontDashboardLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );
  const showAdminPanelLink = shouldShowAdminPanelLink(
    isAuthenticated,
    user?.status,
    user?.roles,
  );

  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAiStudioOpen, setIsAiStudioOpen] = useState(false);

  const browseCategories = useMemo(() => {
    const apiCategories = categoriesData ?? [];
    const roots = apiCategories.filter((category) => !category.parent_id);
    if (roots.length > 0) {
      return roots.map((category) => ({
        slug: category.slug,
        name: category.name,
        subcategories: (category.children ?? []).map((child) => ({
          name: child.name,
          slug: child.slug,
        })),
      }));
    }

    return Object.entries(CATEGORIES).map(([slug, category]) => ({
      slug,
      name: category.name,
      subcategories: category.subcategories.map((name) => ({ name, slug: null as string | null })),
    }));
  }, [categoriesData]);

  if (!isOpen) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <SidebarDrawer
        dir={dir}
        t={t}
        onClose={onClose}
        handleNavigate={handleNavigate}
        showDashboardLink={showDashboardLink}
        showAdminPanelLink={showAdminPanelLink}
        dashboardPath={dashboardPath}
        accountHubPath={accountHubPath}
        isAuthenticated={isAuthenticated}
        openAboutModal={openAboutModal}
        onOpenProjects={() => setIsProjectsOpen(true)}
        onOpenAiStudio={() => setIsAiStudioOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        showCategoriesSection={showCategoriesSection}
        setShowCategoriesSection={setShowCategoriesSection}
        categoriesLoading={categoriesLoading}
        browseCategories={browseCategories}
        openCategory={openCategory}
        setOpenCategory={setOpenCategory}
      />

      {isProjectsOpen && <SidebarProjectsModal onClose={() => setIsProjectsOpen(false)} />}
      {isAiStudioOpen && <SidebarAiStudioModal onClose={() => setIsAiStudioOpen(false)} />}
      {isContactOpen && <SidebarContactModal onClose={() => setIsContactOpen(false)} />}
    </>
  );
}
