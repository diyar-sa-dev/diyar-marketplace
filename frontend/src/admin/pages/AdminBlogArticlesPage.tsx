import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, EyeOff, Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import {
  createAdminBlogCategory,
  createAdminBlogTag,
} from '../../api/adminContentMeta.ts';
import { blogKeys } from '../../hooks/blog/queryKeys.ts';
import { AdminBlogArticleModal, type BlogArticleFormValues } from '../components/AdminBlogArticleModal.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteBlogArticle } from '../../lib/confirmDialog.ts';
import { formatLocaleDate } from '../../lib/intlLocale.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';
import type { BlogArticleCard, BlogArticleDetail, BlogCategory, BlogTag } from '../../types/blog.ts';

function buildArticlePayload(values: BlogArticleFormValues, isCreate: boolean) {
  const payload: Record<string, unknown> = {
    title: values.title,
    slug: values.slug || undefined,
    excerpt: values.excerpt || null,
    content: values.content,
    blog_category_id: values.blog_category_id || null,
    tag_ids: values.tag_ids,
    author_name: values.author_name,
    author_role: values.author_role || null,
    hero_image: values.hero_image || null,
    author_avatar: values.author_avatar || null,
    seo_title: values.seo_title || null,
    seo_description: values.seo_description || null,
  };

  if (isCreate) {
    payload.status = 'draft';
  }

  return payload;
}

function mapArticleToForm(article: BlogArticleDetail): BlogArticleFormValues {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    blog_category_id: article.category?.id ?? '',
    tag_ids: article.tags?.map((tag) => tag.id) ?? [],
    author_name: article.author_name ?? '',
    author_role: article.author_role ?? '',
    hero_image: article.hero_image ?? '',
    author_avatar: article.author_avatar ?? '',
    seo_title: article.seo_title ?? '',
    seo_description: article.seo_description ?? '',
  };
}

async function fetchBlogCategories() {
  const response =
    await adminApi.get<ApiSuccessResponse<{ categories: BlogCategory[] }>>('/admin/blog/categories');
  return response.data.data.categories;
}

async function fetchBlogTags() {
  const response = await adminApi.get<ApiSuccessResponse<{ tags: BlogTag[] }>>('/admin/blog/tags');
  return response.data.data.tags;
}

async function fetchBlogArticle(id: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ article: BlogArticleDetail }>>(
    `/admin/blog/articles/${id}`,
  );
  return response.data.data.article;
}

export default function AdminBlogArticlesPage() {
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
  } = useAdminListQuery<BlogArticleCard>({
    resourceKey: 'admin-blog-articles',
    endpoint: '/admin/blog/articles',
    itemsKey: 'articles',
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'blog-categories'],
    queryFn: fetchBlogCategories,
    enabled: modalOpen,
  });

  const tagsQuery = useQuery({
    queryKey: ['admin', 'blog-tags'],
    queryFn: fetchBlogTags,
    enabled: modalOpen,
  });

  const editingQuery = useQuery({
    queryKey: ['admin', 'blog-article', editingId],
    queryFn: () => fetchBlogArticle(editingId!),
    enabled: modalOpen && Boolean(editingId),
  });

  const articles = data?.items ?? [];
  const meta = data?.meta;

  const invalidateArticles = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'admin-blog-articles'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (values: BlogArticleFormValues) => {
      let categoryId = values.blog_category_id;
      if (values.new_category_name?.trim()) {
        const category = await createAdminBlogCategory(values.new_category_name.trim());
        categoryId = category.id;
      }

      const tagIds = [...values.tag_ids];
      if (values.new_tag_names?.length) {
        for (const name of values.new_tag_names) {
          const tag = await createAdminBlogTag(name);
          tagIds.push(tag.id);
        }
      }

      const payload = buildArticlePayload(
        {
          ...values,
          blog_category_id: categoryId,
          tag_ids: tagIds,
        },
        !editingId,
      );

      if (editingId) {
        await adminApi.patch(`/admin/blog/articles/${editingId}`, payload);
      } else {
        await adminApi.post('/admin/blog/articles', payload);
      }
    },
    onSuccess: async () => {
      toast.success(editingId ? t('admin.blogArticles.updated') : t('admin.blogArticles.created'));
      setModalOpen(false);
      setEditingId(null);
      await Promise.all([
        invalidateArticles(),
        queryClient.invalidateQueries({ queryKey: ['admin', 'blog-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'blog-tags'] }),
        queryClient.invalidateQueries({ queryKey: blogKeys.categories() }),
      ]);
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.blogArticles.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/admin/blog/articles/${id}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.blogArticles.deleted'));
      await invalidateArticles();
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.blogArticles.deleteError'));
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
      await adminApi.post(`/admin/blog/articles/${id}/${action}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.blogArticles.updated'));
      await invalidateArticles();
    },
    onError: (error) => {
      toast.error(parseApiError(error, locale).message || t('admin.blogArticles.updateError'));
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (article: BlogArticleCard) => {
    setEditingId(article.id);
    setModalOpen(true);
  };

  const editingArticle = editingQuery.data;
  const modalInitial = editingId && editingArticle ? mapArticleToForm(editingArticle) : undefined;

  return (
    <>
      <AdminBlogArticleModal
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
        title={t('admin.nav.blog')}
        subtitle={t('admin.blogArticles.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.blogArticles.searchPlaceholder')}
        actions={
          <PermissionGate permission="blog.manage">
            <button
              type="button"
              onClick={openCreate}
              data-testid="admin-blog-create"
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              <Plus size={16} />
              {t('admin.blogArticles.create')}
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
        isEmpty={articles.length === 0}
        emptyTitle={t('admin.blogArticles.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.title')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
        footer={
          <AdminTablePagination meta={meta} page={page} onPageChange={setPage} isLoading={isLoading} />
        }
      >
        {articles.map((article) => (
          <tr key={article.id} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-diyar-dark">{article.title}</p>
                {article.published_at ? (
                  <p className="mt-0.5 text-xs text-gray-400">
                    {formatLocaleDate(article.published_at, locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                ) : null}
              </div>
            </td>
            <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
              {article.slug}
            </td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={article.status} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                {article.status === 'published' ? (
                  <Link
                    to={`/blog/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown"
                  >
                    <Eye size={14} />
                  </Link>
                ) : null}
                <PermissionGate permission="blog.manage">
                  <button
                    type="button"
                    onClick={() => openEdit(article)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                  >
                    <Pencil size={14} />
                    {t('admin.blogArticles.edit')}
                  </button>
                  {article.status !== 'published' ? (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: article.id, action: 'publish' })}
                      data-testid={`blog-publish-${article.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 cursor-pointer"
                    >
                      <Globe size={14} />
                      {t('admin.blogArticles.publish')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: article.id, action: 'unpublish' })}
                      data-testid={`blog-unpublish-${article.slug}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
                    >
                      <EyeOff size={14} />
                      {t('admin.blogArticles.unpublish')}
                    </button>
                  )}
                  {article.status !== 'archived' ? (
                    <button
                      type="button"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: article.id, action: 'archive' })}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 cursor-pointer"
                    >
                      <Archive size={14} />
                      {t('admin.blogArticles.archive')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      const confirmed = await confirmDeleteBlogArticle(t, article.title);
                      if (confirmed) {
                        deleteMutation.mutate(article.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    {t('admin.blogArticles.delete')}
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
