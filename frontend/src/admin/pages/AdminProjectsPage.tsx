import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, EyeOff, Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/client.ts';
import { AdminProjectModal, type ProjectFormValues } from '../components/AdminProjectModal.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteProject } from '../../lib/confirmDialog.ts';
import { formatLocaleDate } from '../../lib/intlLocale.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { ProjectCard, ProjectDetail } from '../../types/project.ts';

function buildProjectPayload(values: ProjectFormValues, isCreate: boolean) {
  const payload: Record<string, unknown> = {
    title: values.title,
    slug: values.slug || undefined,
    description: values.description || null,
    category: values.category,
    location: values.location || null,
    year: values.year,
    cover_image: values.cover_image || null,
    images: values.images.map((image, index) => ({
      image_url: image.image_url,
      alt: image.alt || null,
      sort_order: index,
    })),
  };

  if (isCreate) {
    payload.status = 'draft';
  }

  return payload;
}

function mapProjectToForm(project: ProjectDetail): ProjectFormValues {
  return {
    title: project.title,
    slug: project.slug,
    description: project.description ?? '',
    category: project.category ?? '',
    location: project.location ?? '',
    year: project.year ?? null,
    cover_image: project.cover_image ?? '',
    images:
      project.images?.map((image, index) => ({
        image_url: image.image_url,
        alt: image.alt ?? '',
        sort_order: image.sort_order ?? index,
      })) ?? [],
  };
}

async function fetchProject(id: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ project: ProjectDetail }>>(
    `/admin/projects/${id}`,
  );
  return response.data.data.project;
}

export default function AdminProjectsPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
  } = useAdminListQuery<ProjectCard>({
    resourceKey: 'admin-projects',
    endpoint: '/admin/projects',
    itemsKey: 'projects',
  });

  const editingQuery = useQuery({
    queryKey: ['admin', 'project', editingId],
    queryFn: () => fetchProject(editingId!),
    enabled: modalOpen && Boolean(editingId),
  });

  const projects = data?.items ?? [];
  const meta = data?.meta;

  const invalidateProjects = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'admin-projects'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: ProjectFormValues) => {
      const payload = buildProjectPayload(values, !editingId);
      if (editingId) {
        await adminApi.patch(`/admin/projects/${editingId}`, payload);
      } else {
        await adminApi.post('/admin/projects', payload);
      }
    },
    onSuccess: async () => {
      toast.success(editingId ? t('admin.projects.updated') : t('admin.projects.created'));
      setModalOpen(false);
      setEditingId(null);
      await invalidateProjects();
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.projects.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/admin/projects/${id}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.projects.deleted'));
      await invalidateProjects();
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.projects.deleteError'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      action,
    }: {
      id: string;
      action: 'publish' | 'unpublish' | 'archive';
    }) => {
      await adminApi.post(`/admin/projects/${id}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.projects.updated'));
      await invalidateProjects();
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.projects.updateError'));
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (project: ProjectCard) => {
    setEditingId(project.id);
    setModalOpen(true);
  };

  const editingProject = editingQuery.data;
  const modalInitial = editingId && editingProject ? mapProjectToForm(editingProject) : undefined;

  return (
    <>
      <AdminProjectModal
        open={modalOpen}
        mode={editingId ? 'edit' : 'create'}
        initial={modalInitial}
        isSaving={saveMutation.isPending || editingQuery.isLoading}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <AdminResourceTable
        title={t('admin.nav.projects')}
        subtitle={t('admin.projects.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.projects.searchPlaceholder')}
        actions={
          <PermissionGate permission="projects.manage">
            <button
              type="button"
              onClick={openCreate}
              data-testid="admin-project-create"
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              <Plus size={16} />
              {t('admin.projects.create')}
            </button>
          </PermissionGate>
        }
        filters={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          >
            <option value="">{t('admin.tables.allStatuses')}</option>
            <option value="draft">{t('admin.status.draft')}</option>
            <option value="published">{t('admin.status.published')}</option>
            <option value="archived">{t('admin.status.archived')}</option>
          </select>
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={projects.length === 0}
        emptyTitle={t('admin.projects.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.title')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
            <th className="px-4 py-3 text-start font-semibold">
              {t('admin.detail.vendor.location')}
            </th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        }
      >
        {projects.map((project) => (
          <tr key={project.id} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-diyar-dark">{project.title}</p>
                {project.published_at ? (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatLocaleDate(project.published_at, locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                ) : null}
              </div>
            </td>
            <td className="px-4 py-3 text-start">
              <TableLtrValue className="font-mono text-xs text-gray-500">{project.slug}</TableLtrValue>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{project.location ?? '—'}</td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={project.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                {project.category ? (
                  <span className="inline-flex items-center rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs text-gray-500">
                    {project.category}
                  </span>
                ) : null}
                <PermissionGate permission="projects.manage">
                  <button
                    type="button"
                    onClick={() => openEdit(project)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                  >
                    <Pencil size={14} />
                    {t('admin.projects.edit')}
                  </button>
                  {project.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: project.id, action: 'publish' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 cursor-pointer"
                    >
                      <Globe size={14} />
                      {t('admin.projects.publish')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: project.id, action: 'unpublish' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                    >
                      <EyeOff size={14} />
                      {t('admin.projects.unpublish')}
                    </button>
                  )}
                  {project.status !== 'archived' ? (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: project.id, action: 'archive' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 cursor-pointer"
                    >
                      <Archive size={14} />
                      {t('admin.projects.archive')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmDeleteProject(t, project.title);
                      if (confirmed) {
                        deleteMutation.mutate(project.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    {t('admin.projects.delete')}
                  </button>
                </PermissionGate>
                {project.status === 'published' ? (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600">
                    <Eye size={14} />
                    {t('admin.projects.published')}
                  </span>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </AdminResourceTable>
    </>
  );
}
