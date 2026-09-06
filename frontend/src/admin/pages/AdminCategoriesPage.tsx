import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/client.ts';
import { AdminCategoryModal, type CategoryFormValues } from '../components/AdminCategoryModal.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteCategory } from '../../lib/confirmDialog.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type Category = {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_active?: boolean;
};

async function fetchCategories() {
  const response =
    await adminApi.get<ApiSuccessResponse<{ categories: Category[] }>>('/admin/categories');
  return response.data.data.categories;
}

export default function AdminCategoriesPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const query = useQuery({ queryKey: ['admin', 'categories'], queryFn: fetchCategories });

  const existingSlugs = useMemo(() => (query.data ?? []).map((c) => c.slug), [query.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        is_active: values.is_active,
        ...(values.slug ? { slug: values.slug } : {}),
      };

      if (editing) {
        await adminApi.patch(`/admin/categories/${editing.id}`, payload);
      } else {
        await adminApi.post('/admin/categories', payload);
      }
    },
    onSuccess: async () => {
      toast.success(editing ? t('admin.categories.updated') : t('admin.categories.created'));
      setModalOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (error) => {
      const message = parseApiError(error, locale).message;
      toast.error(
        message ||
          (editing ? t('admin.categories.updateError') : t('admin.categories.createError')),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/admin/categories/${id}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.categories.deleted'));
      await queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (error) => {
      const message = parseApiError(error, locale).message;
      toast.error(message || t('admin.categories.deleteError'));
    },
  });

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    const needle = search.trim().toLowerCase();
    return items.filter((category) => {
      const matchesSearch =
        !needle ||
        (category.name ?? '').toLowerCase().includes(needle) ||
        (category.slug ?? '').toLowerCase().includes(needle);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? category.is_active : !category.is_active);
      const matchesType = typeFilter === 'all' || category.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [query.data, search, statusFilter, typeFilter]);

  const groupedCategories = useMemo(() => {
    const products = filtered.filter((category) => category.type !== 'service');
    const services = filtered.filter((category) => category.type === 'service');
    return { products, services };
  }, [filtered]);

  const renderCategoryRow = (category: Category) => (
    <tr key={category.id} className="hover:bg-[#f7f4f1]/50">
      <td className="px-4 py-3 font-semibold text-diyar-dark">{category.name}</td>
      <td className="px-4 py-3 text-start">
        <TableLtrValue className="font-mono text-xs text-gray-500">{category.slug}</TableLtrValue>
      </td>
      <td className="px-4 py-3">
        <AdminStatusBadge status={category.is_active ? 'active' : 'inactive'} />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          {category.is_active ? (
            <Link
              to={`/category/${category.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
              aria-label={t('admin.tables.view')}
            >
              <Eye size={14} />
            </Link>
          ) : null}
          <PermissionGate permission="categories.manage">
            <button
              type="button"
              onClick={() => openEdit(category)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown hover:text-diyar-brown cursor-pointer"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={async () => {
                const confirmed = await confirmDeleteCategory(t, category.name);
                if (confirmed) {
                  deleteMutation.mutate(category.id);
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </PermissionGate>
        </div>
      </td>
    </tr>
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setModalOpen(true);
  };

  return (
    <>
      <AdminCategoryModal
        open={modalOpen}
        mode={editing ? 'edit' : 'create'}
        initial={
          editing
            ? {
                name: editing.name,
                slug: editing.slug,
                type: editing.type === 'service' ? 'service' : 'product',
                is_active: editing.is_active ?? true,
              }
            : undefined
        }
        existingSlugs={existingSlugs}
        currentSlug={editing?.slug}
        isSaving={saveMutation.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={(values) => saveMutation.mutate(values)}
      />

      <AdminResourceTable
        title={t('admin.nav.categories')}
        subtitle={t('admin.categories.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.tables.searchCategories')}
        actions={
          <PermissionGate permission="categories.manage">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
            >
              <Plus size={16} />
              {t('admin.categories.add')}
            </button>
          </PermissionGate>
        }
        filters={
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="all">{t('admin.categories.allTypes')}</option>
              <option value="product">{t('admin.categories.typeProduct')}</option>
              <option value="service">{t('admin.categories.typeService')}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="all">{t('admin.tables.allStatuses')}</option>
              <option value="active">{t('admin.tables.active')}</option>
              <option value="inactive">{t('admin.tables.inactive')}</option>
            </select>
          </div>
        }
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={filtered.length === 0}
        emptyTitle={t('admin.categories.empty')}
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.name')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.slug')}</th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
      >
        {(typeFilter === 'all' || typeFilter === 'product') &&
        groupedCategories.products.length > 0 ? (
          <>
            {typeFilter === 'all' ? (
              <tr>
                <td
                  colSpan={4}
                  className="bg-[#f7f4f1] px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {t('admin.categories.sectionProducts')}
                </td>
              </tr>
            ) : null}
            {groupedCategories.products.map(renderCategoryRow)}
          </>
        ) : null}
        {(typeFilter === 'all' || typeFilter === 'service') &&
        groupedCategories.services.length > 0 ? (
          <>
            {typeFilter === 'all' ? (
              <tr>
                <td
                  colSpan={4}
                  className="bg-[#f7f4f1] px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                >
                  {t('admin.categories.sectionServices')}
                </td>
              </tr>
            ) : null}
            {groupedCategories.services.map(renderCategoryRow)}
          </>
        ) : null}
      </AdminResourceTable>
    </>
  );
}
