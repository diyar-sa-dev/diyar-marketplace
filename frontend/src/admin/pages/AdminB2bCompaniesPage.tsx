import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { adminApi } from '../../api/client.ts';
import { sanitizeHtml } from '../../utils/sanitizeHtml.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminDetailQuery } from '../hooks/useAdminDetailQuery.ts';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteBlogArticle } from '../../lib/confirmDialog.ts';
import { readB2bPhoneNational } from '../../lib/b2bFormValidation.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { B2bCompanyCard, B2bCompanyDetail } from '../../types/b2b.ts';

type AdminB2bCompanyDetail = B2bCompanyDetail & {
  id: string;
  custom_category?: string | null;
  business_hours?: string | null;
  b2b_category_id?: string | null;
  publication_status?: string;
  verification_status?: string;
  published_at?: string | null;
};

type AdminB2bPreviewModalProps = {
  open: boolean;
  companyId: string | null;
  onClose: () => void;
  onPublish: (id: string) => void;
  isPublishPending: boolean;
};

type AdminIconHoverActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  hint?: string;
  children: ReactNode;
};

function AdminIconHoverAction({
  label,
  hint,
  children,
  className = '',
  ...buttonProps
}: AdminIconHoverActionProps) {
  return (
    <span className="relative inline-flex group/icon-action">
      <button
        type="button"
        {...buttonProps}
        aria-label={hint ? `${label}. ${hint}` : label}
        className={`rounded-lg p-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {children}
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+0.375rem)] left-1/2 z-30 w-max max-w-56 -translate-x-1/2 rounded-xl bg-diyar-dark px-3 py-2 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover/icon-action:opacity-100 group-focus-within/icon-action:opacity-100"
      >
        <span className="block text-[11px] font-bold leading-tight text-white">{label}</span>
        {hint ? (
          <span className="mt-1 block text-[10px] font-normal leading-snug text-white/75">
            {hint}
          </span>
        ) : null}
        <span
          aria-hidden
          className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-diyar-dark"
        />
      </span>
    </span>
  );
}

function AdminB2bPreviewModal({
  open,
  companyId,
  onClose,
  onPublish,
  isPublishPending,
}: AdminB2bPreviewModalProps) {
  const { t, dir } = useLocale();
  const {
    data: company,
    isPending,
    isError,
    error,
    refetch,
  } = useAdminDetailQuery<AdminB2bCompanyDetail>({
    resourceKey: 'admin-b2b-company-preview',
    endpoint: companyId ? `/admin/b2b/companies/${companyId}` : '',
    dataKey: 'company',
    enabled: open && Boolean(companyId),
  });

  if (!open) return null;

  const categoryLabel = company?.custom_category ?? company?.category?.name ?? '—';
  const isDraft = company?.publication_status !== 'published';
  const phoneNational = readB2bPhoneNational(company?.phone);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-b2b-preview-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-diyar-brown">
              {t('admin.b2b.preview.badge')}
            </p>
            <h2
              id="admin-b2b-preview-title"
              className="mt-1 truncate text-xl font-bold text-diyar-dark"
            >
              {company?.name ?? t('admin.b2b.preview.loadingTitle')}
            </h2>
            {company ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AdminStatusBadge status={company.publication_status ?? 'draft'} />
                <AdminStatusBadge status={company.verification_status ?? 'pending'} />
                <span className="text-xs text-gray-400">{company.slug}</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 cursor-pointer"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isPending ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-diyar-brown" />
            </div>
          ) : isError || !company ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {parseApiError(error).message}
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 block font-bold text-diyar-brown hover:underline cursor-pointer"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {isDraft ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {t('admin.b2b.preview.draftNotice')}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[7rem_1fr]">
                <div className="h-28 w-28 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  {company.logo ? (
                    <img src={company.logo} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <Building2 size={28} />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  {company.cover_image ? (
                    <img src={company.cover_image} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-gray-300">
                      <Building2 size={32} />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PreviewField label={t('admin.b2b.fields.category')} value={categoryLabel} />
                <PreviewField label={t('admin.b2b.fields.name')} value={company.name} />
                <PreviewField
                  label={t('admin.b2b.fields.description')}
                  value={company.description ?? '—'}
                  className="md:col-span-2"
                />
                <PreviewField
                  label={t('admin.b2b.fields.about')}
                  value={company.about ?? '—'}
                  className="md:col-span-2"
                  html
                />
              </div>

              <section>
                <h3 className="mb-3 text-sm font-bold text-diyar-dark">
                  {t('b2b.company.contact')}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PreviewField
                    icon={<MapPin size={15} />}
                    label={t('b2b.partner.fields.location')}
                    value={company.location ?? '—'}
                  />
                  <PreviewField
                    icon={<Phone size={15} />}
                    label={t('admin.b2b.fields.phone')}
                    value={phoneNational ? `+966 ${phoneNational}` : '—'}
                  />
                  <PreviewField
                    icon={<Mail size={15} />}
                    label={t('admin.b2b.fields.email')}
                    value={company.email ?? '—'}
                  />
                  <PreviewField
                    icon={<Globe size={15} />}
                    label={t('admin.b2b.fields.website')}
                    value={company.website?.replace(/^https?:\/\//, '') ?? '—'}
                  />
                  <PreviewField
                    icon={<Clock size={15} />}
                    label={t('b2b.partner.fields.businessHours')}
                    value={company.business_hours ?? '—'}
                    className="md:col-span-2"
                  />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold text-diyar-dark">
                  {t('admin.b2b.preview.stats')}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <PreviewField
                    label={t('admin.b2b.fields.yearsExperience')}
                    value={
                      company.stats.years_experience ? `+${company.stats.years_experience}` : '—'
                    }
                  />
                  <PreviewField
                    label={t('admin.b2b.fields.completedProjects')}
                    value={
                      company.stats.completed_projects
                        ? `+${company.stats.completed_projects}`
                        : '—'
                    }
                  />
                  <PreviewField
                    label={t('admin.b2b.fields.teamSize')}
                    value={company.stats.team_size_label ?? company.stats.team_size ?? '—'}
                  />
                </div>
              </section>

              {company.services && company.services.length > 0 ? (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-diyar-dark">
                    <Briefcase size={16} className="text-diyar-brown" />
                    {t('admin.b2b.fields.services')}
                  </h3>
                  <div className="space-y-2">
                    {company.services.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-3"
                      >
                        <p className="font-semibold text-diyar-dark">{service.name}</p>
                        {service.description ? (
                          <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {company.portfolio_gallery && company.portfolio_gallery.length > 0 ? (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-diyar-dark">
                    <Briefcase size={16} className="text-diyar-brown" />
                    {t('b2b.company.portfolio')}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {company.portfolio_gallery.map((image, index) => (
                      <div
                        key={image.id}
                        className="aspect-4/3 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                      >
                        <img
                          src={image.url}
                          alt={t('b2b.company.portfolioItem', { index: index + 1 })}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            {t('common.close')}
          </button>
          {company?.publication_status === 'published' && company.slug ? (
            <Link
              to={`/b2b/${company.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white hover:bg-black cursor-pointer"
            >
              <Globe size={16} />
              {t('admin.b2b.viewPublic')}
            </Link>
          ) : null}
          {company && isDraft ? (
            <button
              type="button"
              disabled={isPublishPending}
              onClick={() => onPublish(company.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60 cursor-pointer"
            >
              {isPublishPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Eye size={16} />
              )}
              {t('admin.actions.publish')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PreviewField({
  label,
  value,
  icon,
  className = '',
  html = false,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  html?: boolean;
}) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-4 ${className}`}>
      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium text-diyar-dark wrap-break-word">
        {html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(value)) }}
          />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

export default function AdminB2bCompaniesPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewCompanyId, setPreviewCompanyId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isFetching,
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

  const companies = data?.items ?? [];
  const meta = data?.meta;
  const showSkeleton = isLoading || (isFetching && companies.length === 0);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'admin-b2b-companies'] });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'admin-b2b-company-preview'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/admin/b2b/companies/${id}`);
    },
    onSuccess: async () => {
      toast.success(t('admin.b2b.deleted'));
      setPreviewCompanyId(null);
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

  const handlePublish = async (id: string) => {
    await actionMutation.mutateAsync({ id, action: 'publish' });
    setPreviewCompanyId(null);
  };

  return (
    <div data-testid="admin-b2b-companies-page">
      <AdminResourceTable
        title={t('admin.b2b.title')}
        subtitle={t('admin.b2b.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.b2b.searchPlaceholder')}
        isLoading={showSkeleton}
        isError={isError}
        isEmpty={!showSkeleton && companies.length === 0}
        emptyTitle={t('admin.b2b.empty')}
        filters={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-diyar-brown cursor-pointer"
          >
            <option value="">{t('admin.tables.allStatuses')}</option>
            <option value="draft">{t('admin.status.draft')}</option>
            <option value="published">{t('admin.status.published')}</option>
            <option value="archived">{t('admin.status.archived')}</option>
          </select>
        }
        columns={
          <tr>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.name')}</th>
            <th className="px-4 py-3 text-start font-semibold">
              {t('admin.b2b.columns.category')}
            </th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.tables.status')}</th>
            <th className="px-4 py-3 text-start font-semibold">
              {t('admin.b2b.columns.verification')}
            </th>
            <th className="px-4 py-3 text-start font-semibold">{t('admin.b2b.columns.rating')}</th>
            <th className="px-4 py-3 text-end font-semibold">{t('admin.tables.actions')}</th>
          </tr>
        }
        footer={
          <AdminTablePagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            isLoading={isFetching}
          />
        }
      >
        {companies.map((company) => (
          <tr key={company.id ?? company.slug} className="hover:bg-[#f7f4f1]/50">
            <td className="px-4 py-3">
              <p className="font-semibold text-diyar-dark">{company.name}</p>
              <p className="text-xs text-gray-400">{company.slug}</p>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
              {company.custom_category ?? company.category?.name ?? '—'}
            </td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={company.publication_status ?? 'draft'} />
            </td>
            <td className="px-4 py-3">
              <AdminStatusBadge status={company.verification_status ?? 'pending'} />
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1 text-sm">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                {Number(company.rating).toFixed(1)}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                {company.id ? (
                  <button
                    type="button"
                    className="rounded-lg p-2 text-diyar-brown hover:bg-diyar-cream/40 cursor-pointer"
                    title={t('admin.b2b.preview.open')}
                    data-testid={`b2b-preview-${company.slug}`}
                    onClick={() => setPreviewCompanyId(company.id!)}
                  >
                    <Eye size={16} />
                  </button>
                ) : null}
                {company.slug && company.publication_status === 'published' ? (
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
                  {company.publication_status !== 'published' ? (
                    <button
                      type="button"
                      className="rounded-lg px-2.5 py-2 text-xs font-bold text-green-700 hover:bg-green-50 cursor-pointer"
                      title={t('admin.actions.publish')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-publish-${company.slug}`}
                      onClick={() =>
                        company.id && actionMutation.mutate({ id: company.id, action: 'publish' })
                      }
                    >
                      {t('admin.actions.publish')}
                    </button>
                  ) : null}
                  {company.publication_status === 'published' ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 cursor-pointer"
                      title={t('admin.actions.unpublish')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-unpublish-${company.slug}`}
                      onClick={() =>
                        company.id && actionMutation.mutate({ id: company.id, action: 'unpublish' })
                      }
                    >
                      <EyeOff size={16} />
                    </button>
                  ) : null}
                  {company.verification_status !== 'verified' ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
                      title={t('admin.b2b.verify')}
                      disabled={actionMutation.isPending}
                      data-testid={`b2b-verify-${company.slug}`}
                      onClick={() =>
                        company.id && actionMutation.mutate({ id: company.id, action: 'verify' })
                      }
                    >
                      <BadgeCheck size={16} />
                    </button>
                  ) : null}
                  {company.featured ? (
                    <AdminIconHoverAction
                      label={t('admin.b2b.unfeature')}
                      className="text-amber-600 hover:bg-amber-50"
                      disabled={actionMutation.isPending}
                      onClick={() =>
                        company.id && actionMutation.mutate({ id: company.id, action: 'unfeature' })
                      }
                    >
                      <StarOff size={16} />
                    </AdminIconHoverAction>
                  ) : (
                    <AdminIconHoverAction
                      label={t('admin.b2b.feature')}
                      hint={t('admin.b2b.featureHint')}
                      className="text-amber-600 hover:bg-amber-50"
                      disabled={actionMutation.isPending}
                      onClick={() =>
                        company.id && actionMutation.mutate({ id: company.id, action: 'feature' })
                      }
                    >
                      <Star size={16} />
                    </AdminIconHoverAction>
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

      <AdminB2bPreviewModal
        open={previewCompanyId !== null}
        companyId={previewCompanyId}
        onClose={() => setPreviewCompanyId(null)}
        onPublish={handlePublish}
        isPublishPending={actionMutation.isPending}
      />
    </div>
  );
}
