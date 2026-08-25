import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Eye, EyeOff, Globe, Pencil, Plus, Star, StarOff, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import {
  AdminB2bCompanyModal,
  type B2bCompanyFormValues,
} from '../components/AdminB2bCompanyModal.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteBlogArticle } from '../../lib/confirmDialog.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { B2bCategory, B2bCompanyCard, B2bCompanyDetail, B2bTag } from '../../types/b2b.ts';

function buildCompanyPayload(values: B2bCompanyFormValues, isCreate: boolean) {
  const payload: Record<string, unknown> = {
    name: values.name,
    slug: values.slug || undefined,
    b2b_category_id: values.b2b_category_id || null,
    description: values.description || null,
    about: values.about || null,
    logo: values.logo || null,
    cover_image: values.cover_image || null,
    location: values.location || null,
    phone: values.phone || null,
    email: values.email || null,
    website: values.website || null,
    years_experience: values.years_experience,
    team_size: values.team_size,
    completed_projects: values.completed_projects ?? 0,
    rating: values.rating ?? 0,
    reviews_count: values.reviews_count ?? 0,
    tag_ids: values.tag_ids,
    services: values.services.map((service) => ({
      name: service.name,
      description: service.description || null,
    })),
  };

  if (isCreate) {
    payload.publication_status = 'draft';
  }

  return payload;
}

function mapCompanyToForm(company: B2bCompanyDetail): B2bCompanyFormValues {
  return {
    name: company.name,
    slug: company.slug,
    b2b_category_id: company.category?.id ?? '',
    description: company.description ?? '',
    about: company.about ?? '',
    logo: company.logo ?? '',
    cover_image: company.cover_image ?? '',
    location: company.location ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    website: company.website ?? '',
    years_experience: company.stats?.years_experience ?? null,
    team_size: company.stats?.team_size ?? null,
    completed_projects: company.stats?.completed_projects ?? 0,
    rating: company.rating ?? 0,
    reviews_count: company.reviews_count ?? 0,
    tag_ids: company.tags?.map((tag) => tag.id) ?? [],
    services:
      company.services?.map((service) => ({
        name: service.name,
        description: service.description ?? '',
      })) ?? [],
  };
}

async function fetchB2bCategories() {
  const response =
    await adminApi.get<ApiSuccessResponse<{ categories: B2bCategory[] }>>('/admin/b2b/categories');
  return response.data.data.categories;
}

async function fetchB2bTags() {
  const response = await adminApi.get<ApiSuccessResponse<{ tags: B2bTag[] }>>('/admin/b2b/tags');
  return response.data.data.tags;
}

async function fetchB2bCompany(id: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ company: B2bCompanyDetail }>>(
    `/admin/b2b/companies/${id}`,
  );
  return response.data.data.company;
}

export default function AdminB2bCompaniesPage() {
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
  } = useAdminListQuery<B2bCompanyCard>({
    resourceKey: 'admin-b2b-companies',
    endpoint: '/admin/b2b/companies',
    itemsKey: 'companies',
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'b2b-categories'],
    queryFn: fetchB2bCategories,
  });

  const tagsQuery = useQuery({
    queryKey: ['admin', 'b2b-tags'],
    queryFn: fetchB2bTags,
  });

  const editingQuery = useQuery({
    queryKey: ['admin', 'b2b-company', editingId],
    queryFn: () => fetchB2bCompany(editingId!),
    enabled: modalOpen && Boolean(editingId),
  });

  const companies = data?.items ?? [];
  const meta = data?.meta;

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'admin-b2b-companies'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: B2bCompanyFormValues) => {
      const payload = buildCompanyPayload(values, !editingId);
      if (editingId) {
        await adminApi.patch(`/admin/b2b/companies/${editingId}`, payload);
      } else {
        await adminApi.post('/admin/b2b/companies', payload);
      }
    },
    onSuccess: async () => {
      toast.success(editingId ? t('admin.b2b.updated') : t('admin.b2b.created'));
      setModalOpen(false);
      setEditingId(null);
      await invalidate();
    },
    onError: (error) => toast.error(parseApiError(error, locale).message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/admin/b2b/companies/${id}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.b2b.deleted'));
      await invalidate();
    },
    onError: (error) => toast.error(parseApiError(error, locale).message),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      await adminApi.post(`/admin/b2b/companies/${id}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.b2b.actionSuccess'));
      await invalidate();
    },
    onError: (error) => toast.error(parseApiError(error, locale).message),
  });

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (company: B2bCompanyCard) => {
    if (!company.id) return;
    setEditingId(company.id);
    setModalOpen(true);
  };

  const editingCompany = editingQuery.data;
  const modalInitial =
    editingId && editingCompany ? mapCompanyToForm(editingCompany) : undefined;

  return (
    <>
      <AdminB2bCompanyModal
        key={editingId ?? 'create'}
        open={modalOpen}
        mode={editingId ? 'edit' : 'create'}
        initial={modalInitial}
        categories={categoriesQuery.data ?? []}
        tags={tagsQuery.data ?? []}
        isSaving={saveMutation.isPending || editingQuery.isLoading}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <AdminResourceTable
        title={t('admin.b2b.title')}
        subtitle={t('admin.b2b.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.b2b.searchPlaceholder')}
        actions={
          <PermissionGate permission="b2b.manage">
            <button
              type="button"
              onClick={openCreate}
              data-testid="admin-b2b-create"
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              <Plus size={16} />
              {t('admin.b2b.create')}
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
        isEmpty={companies.length === 0}
        emptyTitle={t('admin.b2b.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.name')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.category')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.verification')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.rating')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
        footer={
          <AdminTablePagination meta={meta} page={page} onPageChange={setPage} isLoading={isLoading} />
        }
      >
        {companies.map((company) => (
          <tr key={company.id ?? company.slug} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3">
              <p className="font-semibold text-diyar-dark">{company.name}</p>
              <p className="text-xs text-gray-400">{company.slug}</p>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{company.category?.name ?? '—'}</td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={company.publication_status ?? 'draft'} />
            </td>
            <td className="px-4 py-3 text-sm">{company.verification_status ?? 'pending'}</td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1 text-sm">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {Number(company.rating).toFixed(1)}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                {company.slug ? (
                  <Link
                    to={`/b2b/${company.slug}`}
                    target="_blank"
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
                    title={t('admin.b2b.viewPublic')}
                  >
                    <Globe size={16} />
                  </Link>
                ) : null}
                <PermissionGate permission="b2b.manage">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
                    title={t('admin.actions.edit')}
                    onClick={() => openEdit(company)}
                  >
                    <Pencil size={16} />
                  </button>
                  {company.publication_status !== 'published' ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-green-600 hover:bg-green-50 cursor-pointer"
                      title={t('admin.actions.publish')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-publish-${company.slug}`}
                      onClick={() => company.id && actionMutation.mutate({ id: company.id, action: 'publish' })}
                    >
                      <Eye size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title={t('admin.actions.unpublish')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-unpublish-${company.slug}`}
                      onClick={() => company.id && actionMutation.mutate({ id: company.id, action: 'unpublish' })}
                    >
                      <EyeOff size={16} />
                    </button>
                  )}
                  {company.verification_status !== 'verified' ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title={t('admin.b2b.verify')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-verify-${company.slug}`}
                      onClick={() => company.id && actionMutation.mutate({ id: company.id, action: 'verify' })}
                    >
                      <BadgeCheck size={16} />
                    </button>
                  ) : null}
                  {company.featured ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title={t('admin.b2b.unfeature')}
                      disabled={actionMutation.isPending}
                      onClick={() => company.id && actionMutation.mutate({ id: company.id, action: 'unfeature' })}
                    >
                      <StarOff size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title={t('admin.b2b.feature')}
                      disabled={actionMutation.isPending}
                      onClick={() => company.id && actionMutation.mutate({ id: company.id, action: 'feature' })}
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 cursor-pointer"
                    title={t('admin.actions.delete')}
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      if (!company.id) return;
                      const confirmed = await confirmDeleteBlogArticle(t, company.name);
                      if (confirmed) deleteMutation.mutate(company.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
              </div>
            </td>
          </tr>
        ))}
      </AdminResourceTable>
    </>
  );
}
