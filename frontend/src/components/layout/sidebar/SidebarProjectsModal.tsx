import { useState } from 'react';
import { X, ChevronLeft, FolderGit2, MapPin } from 'lucide-react';
import { useProjects } from '../../../hooks/projects/useProjects.ts';
import { useProject } from '../../../hooks/projects/useProject.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import {
  ProjectShowcaseDetailSkeleton,
  ProjectShowcaseListSkeleton,
} from './SidebarMenuSkeletons.tsx';

type SidebarProjectsModalProps = {
  onClose: () => void;
};

export function SidebarProjectsModal({ onClose }: SidebarProjectsModalProps) {
  const { t, dir } = useLocale();
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = useProjects({ per_page: 20 });
  const { data: selectedProject, isLoading: selectedProjectLoading } = useProject(
    selectedProjectSlug ?? undefined,
    {
      enabled: Boolean(selectedProjectSlug),
    },
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-250"
      dir={dir}
    >
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={() => {
            onClose();
            setSelectedProjectSlug(null);
          }}
          className="cursor-pointer absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-500 hover:text-black p-2.5 rounded-full shadow-md z-10 transition-all border border-gray-200"
          title={t('projects.showcase.close')}
        >
          <X size={18} />
        </button>

        <div className="p-6 md:p-8 bg-[#132624] text-diyar-cream shrink-0 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/2 rounded-full -mr-8 -mt-8" />
          <FolderGit2 className="w-12 h-12 text-diyar-brown mx-auto mb-3" />
          <h3 className="text-xl md:text-2xl font-bold mb-1.5 font-sans">
            {t('projects.showcase.title')}
          </h3>
          <p className="text-xs md:text-sm text-diyar-cream max-w-lg mx-auto opacity-90 leading-relaxed">
            {t('projects.showcase.subtitle')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-gray-50">
          {selectedProjectSlug && selectedProject ? (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="w-full h-56 md:h-72 relative">
                <img
                  src={
                    selectedProject.cover_image ??
                    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
                  }
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {selectedProject.category ? (
                  <span className="absolute bottom-3 right-3 bg-[#132624] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    {selectedProject.category}
                  </span>
                ) : null}
              </div>
              <div className="p-5 md:p-6 space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedProjectSlug(null)}
                  className="cursor-pointer text-xs font-bold text-diyar-brown hover:text-[#132624] flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft size={14} className="rtl:rotate-180" />{' '}
                  {t('projects.showcase.backToGallery')}
                </button>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <MapPin size={12} className="text-diyar-brown" />
                  <span>{selectedProject.location ?? '—'}</span>
                </div>
                <h4 className="text-lg font-bold text-diyar-dark leading-snug">
                  {selectedProject.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {selectedProject.description}
                </p>
                {selectedProject.images && selectedProject.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {selectedProject.images.map((image) => (
                      <img
                        key={image.id}
                        src={image.image_url}
                        alt={image.alt ?? selectedProject.title}
                        className="w-full h-28 object-cover rounded-xl border border-gray-100"
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                ) : null}
                <div className="pt-4 border-t border-gray-50 text-[11px] text-gray-400 font-bold">
                  {selectedProject.year
                    ? `${selectedProject.year}${t('projects.showcase.yearSuffix') ? ` ${t('projects.showcase.yearSuffix')}` : ''} • `
                    : ''}
                  {t('projects.showcase.delivered')}
                </div>
              </div>
            </div>
          ) : selectedProjectSlug && selectedProjectLoading ? (
            <ProjectShowcaseDetailSkeleton />
          ) : projectsLoading ? (
            [...Array(3)].map((_, index) => <ProjectShowcaseListSkeleton key={index} />)
          ) : projectsError ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500 mb-4">{t('projects.showcase.loadError')}</p>
              <button
                type="button"
                onClick={() => void refetchProjects()}
                className="cursor-pointer text-xs font-bold text-diyar-brown hover:text-[#132624]"
              >
                {t('projects.showcase.retry')}
              </button>
            </div>
          ) : (projectsData?.items ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-sm text-gray-500">
              {t('projects.showcase.empty')}
            </div>
          ) : (
            (projectsData?.items ?? []).map((proj) => (
              <div
                key={proj.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5 hover:shadow-md transition-shadow"
              >
                <div className="w-full md:w-2/5 h-44 md:h-auto relative shrink-0">
                  <img
                    src={
                      proj.cover_image ??
                      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800'
                    }
                    alt={proj.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {proj.category ? (
                    <span className="absolute bottom-3 right-3 bg-[#132624] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      {proj.category}
                    </span>
                  ) : null}
                </div>
                <div className="p-5 md:py-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                      <MapPin size={12} className="text-diyar-brown" />
                      <span>{proj.location ?? '—'}</span>
                    </div>
                    <h4 className="text-base font-bold text-diyar-dark mb-2.5 leading-snug">
                      {proj.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal line-clamp-3">
                      {proj.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-bold">
                      {proj.year
                        ? `${proj.year}${t('projects.showcase.yearSuffix') ? ` ${t('projects.showcase.yearSuffix')}` : ''} • `
                        : ''}
                      {t('projects.showcase.delivered')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectSlug(proj.slug)}
                      className="cursor-pointer text-xs font-bold text-diyar-brown hover:text-[#132624] flex items-center gap-1 transition-colors"
                    >
                      {t('projects.showcase.viewDetails')}{' '}
                      <ChevronLeft size={14} className="rtl:rotate-180" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
