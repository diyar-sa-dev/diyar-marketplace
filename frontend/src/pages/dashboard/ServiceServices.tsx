import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock,
  X,
  Upload,
  Loader2,
  Filter,
} from 'lucide-react';
import { PaginationBar } from '../../components/catalog/PaginationBar.tsx';
import { FieldError } from '../../components/dashboard/vendor/FieldError.tsx';
import { RequiredLabel } from '../../components/dashboard/vendor/RequiredLabel.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import { ProviderServiceCardSkeleton } from '../../components/provider/ProviderServiceCardSkeleton.tsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.ts';
import {
  useCreateProviderService,
  useDeleteProviderService,
  useProviderOwnServices,
  useUpdateProviderService,
} from '../../hooks/provider/useProviderDashboard.ts';
import { useServiceCategories } from '../../hooks/services/useServices.ts';
import {
  formatProviderServiceDuration,
  formatWesternNumber,
} from '../../lib/providerDashboardUi.ts';
import { useToast } from '../../hooks/useToast.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { parseApiError } from '../../utils/errors.ts';
import { getServiceTypeOptionsForCategory } from '../../lib/serviceCategoryTypes.ts';
import type { ServiceCard } from '../../types/services.ts';

type ServiceFormState = {
  title: string;
  starting_price: string;
  service_category_id: string;
  service_type_label: string;
  duration_label: string;
  location: string;
  description: string;
  is_active: boolean;
  cover?: File;
};

type ServiceFilter = 'all' | 'active' | 'inactive';

type ServiceFormErrors = {
  title?: string;
  starting_price?: string;
};

const emptyForm = (): ServiceFormState => ({
  title: '',
  starting_price: '',
  service_category_id: '',
  service_type_label: '',
  duration_label: '',
  location: '',
  description: '',
  is_active: true,
});

const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50 placeholder:text-gray-400 text-start';

const PER_PAGE = 9;

function validateServiceForm(
  form: ServiceFormState,
  t: (key: string) => string,
): ServiceFormErrors {
  const errors: ServiceFormErrors = {};
  if (!form.title.trim()) {
    errors.title = t('providerDashboard.services.validation.titleRequired');
  }
  const priceRaw = form.starting_price.trim();
  if (!priceRaw) {
    errors.starting_price = t('providerDashboard.services.validation.priceRequired');
  } else if (!/^\d+(\.\d{1,2})?$/.test(priceRaw)) {
    errors.starting_price = t('providerDashboard.services.validation.priceDigits');
  } else if (Number(priceRaw) < 10) {
    errors.starting_price = t('providerDashboard.services.validation.priceMin');
  }
  return errors;
}

export default function ServiceServices() {
  const { t, dir, locale } = useLocale();
  const { toast } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ServiceFilter>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCard | null>(null);
  const [form, setForm] = useState<ServiceFormState>(emptyForm());
  const [fieldErrors, setFieldErrors] = useState<ServiceFormErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<ServiceCard | null>(null);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data, isLoading, isError, error, refetch } = useProviderOwnServices(
    page,
    PER_PAGE,
    debouncedSearch.trim() || undefined,
  );
  const createService = useCreateProviderService();
  const updateService = useUpdateProviderService();
  const deleteService = useDeleteProviderService();
  const { data: serviceCategories = [] } = useServiceCategories();

  const services = useMemo(() => {
    const items = data?.items ?? [];
    if (statusFilter === 'active') {
      return items.filter((service) => service.is_active !== false);
    }
    if (statusFilter === 'inactive') {
      return items.filter((service) => service.is_active === false);
    }
    return items;
  }, [data?.items, statusFilter]);

  const defaultCategoryId = services[0]?.category?.id ?? serviceCategories[0]?.id ?? '';

  const selectedCategorySlug = useMemo(() => {
    const categoryId = form.service_category_id || defaultCategoryId;
    return serviceCategories.find((category) => category.id === categoryId)?.slug;
  }, [form.service_category_id, defaultCategoryId, serviceCategories]);

  const serviceTypeOptions = getServiceTypeOptionsForCategory(selectedCategorySlug);

  const categoryLabel = (nameAr: string, nameEn: string) => (locale === 'ar' ? nameAr : nameEn);

  useEffect(() => {
    if (selectedService) {
      setForm({
        title: selectedService.title,
        starting_price:
          selectedService.starting_price != null ? String(selectedService.starting_price) : '',
        service_category_id: selectedService.category?.id ?? defaultCategoryId,
        service_type_label: selectedService.service_type_label ?? '',
        duration_label: selectedService.duration_label ?? '',
        location: selectedService.location ?? '',
        description: selectedService.description ?? '',
        is_active: selectedService.is_active !== false,
      });
      return;
    }
    if (isAddModalOpen) {
      setForm({
        ...emptyForm(),
        service_category_id: defaultCategoryId,
      });
    }
  }, [selectedService, isAddModalOpen, defaultCategoryId]);

  const closeModal = () => {
    setIsAddModalOpen(false);
    setSelectedService(null);
    setForm(emptyForm());
    setFieldErrors({});
  };

  const handlePriceChange = (value: string) => {
    const digitsOnly = value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setForm((prev) => ({ ...prev, starting_price: digitsOnly }));
    if (fieldErrors.starting_price) {
      setFieldErrors((prev) => ({ ...prev, starting_price: undefined }));
    }
  };

  const handleSave = async () => {
    const errors = validateServiceForm(form, t);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      title: form.title.trim(),
      starting_price: Number(form.starting_price),
      service_category_id: form.service_category_id || undefined,
      service_type_label: form.service_type_label.trim() || undefined,
      duration_label: form.duration_label.trim() || undefined,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      is_active: form.is_active,
      cover: form.cover,
    };

    try {
      if (selectedService) {
        await updateService.mutateAsync({ serviceId: selectedService.id, payload });
        toast.success(t('providerDashboard.services.toast.updated'));
      } else {
        await createService.mutateAsync(payload);
        toast.success(t('providerDashboard.services.toast.created'));
      }
      closeModal();
    } catch (err) {
      toast.error(parseApiError(err, locale).message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteService.mutateAsync(deleteTarget.id);
      toast.success(t('providerDashboard.services.toast.deleted'));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(parseApiError(err, locale).message);
    }
  };

  const saving = createService.isPending || updateService.isPending;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-diyar-dark">
            {t('providerDashboard.services.title')}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t('providerDashboard.services.subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder={t('providerDashboard.services.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="ps-10 pe-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-diyar-brown/20 focus:border-diyar-brown text-sm w-full md:w-64 bg-white"
            />
            <Search
              size={18}
              className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-diyar-brown text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#856b54] transition cursor-pointer shadow-sm"
          >
            <Plus size={18} />
            {t('providerDashboard.services.addService')}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {(
          [
            { id: 'all', label: t('providerDashboard.services.filters.all') },
            { id: 'active', label: t('providerDashboard.services.filters.active') },
            { id: 'inactive', label: t('providerDashboard.services.filters.inactive') },
          ] as const
        ).map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setStatusFilter(filter.id);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === filter.id
                ? 'bg-diyar-dark text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter.id !== 'all' && <Filter size={14} />}
            {filter.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState
          message={t('providerDashboard.services.loadError')}
          error={error as Error}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: PER_PAGE }).map((_, index) => (
            <ProviderServiceCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-diyar-brown/20 transition-all overflow-hidden"
              >
                <div className="relative h-40 bg-linear-to-br from-diyar-cream/40 to-gray-50 overflow-hidden">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-diyar-brown/30">
                      <Upload size={32} />
                    </div>
                  )}
                  {service.is_active === false && (
                    <div className="absolute top-3 inset-e-3 bg-gray-900/70 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t('providerDashboard.services.inactiveBadge')}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {service.category?.name && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-diyar-cream/60 text-diyar-brown border border-diyar-brown/15">
                        {service.category.name}
                      </span>
                    )}
                    {service.service_type_label && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                        {service.service_type_label}
                      </span>
                    )}
                    {service.pricing_label && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                        {service.pricing_label}
                      </span>
                    )}
                  </div>

                  <h3
                    className={`font-bold text-lg mb-2 line-clamp-1 ${service.is_active !== false ? 'text-diyar-dark' : 'text-gray-400'}`}
                  >
                    {service.title}
                  </h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {formatProviderServiceDuration(service) && (
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-gray-400 shrink-0" />
                        <span className="truncate">
                          {t('providerDashboard.services.durationLabel', {
                            value: formatProviderServiceDuration(service),
                          })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-gray-400 shrink-0" />
                      <span className="truncate">{service.location ?? '—'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                    <span
                      className={`font-bold text-xl tabular-nums ${service.is_active !== false ? 'text-diyar-brown' : 'text-gray-400'}`}
                      dir="ltr"
                    >
                      {formatWesternNumber(Number(service.starting_price ?? 0))}{' '}
                      <span className="text-sm">{t('providerDashboard.common.currency')}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className="p-2.5 text-gray-500 hover:text-diyar-brown bg-gray-50 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                        title={t('providerDashboard.services.editService')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(service)}
                        className="p-2.5 text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title={t('providerDashboard.services.deleteService')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="py-16 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              {t('providerDashboard.services.empty')}
            </div>
          )}

          {data?.pagination && statusFilter === 'all' && (
            <PaginationBar
              pagination={data.pagination}
              page={page}
              onPageChange={setPage}
              className="mt-4"
            />
          )}
        </>
      )}

      {(isAddModalOpen || selectedService) && (
        <div className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300"
            dir={dir}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-diyar-dark">
                {selectedService
                  ? t('providerDashboard.services.modal.editTitle')
                  : t('providerDashboard.services.modal.addTitle')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50 hover:bg-amber-50/50 hover:border-diyar-brown/40 transition-colors cursor-pointer overflow-hidden"
              >
                {selectedService?.image_url && !form.cover ? (
                  <img
                    src={selectedService.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : form.cover ? (
                  <span className="text-sm font-medium text-diyar-dark px-4 truncate max-w-full">
                    {form.cover.name}
                  </span>
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-diyar-brown/50" />
                    <span className="text-sm font-medium text-gray-600">
                      {t('providerDashboard.services.modal.coverUpload')}
                    </span>
                  </>
                )}
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setForm((prev) => ({ ...prev, cover: file }));
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.name')}
                  </RequiredLabel>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, title: e.target.value }));
                      if (fieldErrors.title)
                        setFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    placeholder={t('providerDashboard.services.modal.namePlaceholder')}
                    className={`${INPUT_CLASS} ${fieldErrors.title ? 'border-red-300' : ''}`}
                  />
                  <FieldError message={fieldErrors.title} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.category')}
                  </RequiredLabel>
                  <select
                    value={form.service_category_id}
                    onChange={(e) => {
                      const nextCategoryId = e.target.value;
                      const nextSlug = serviceCategories.find(
                        (category) => category.id === nextCategoryId,
                      )?.slug;
                      const nextOptions = getServiceTypeOptionsForCategory(nextSlug);
                      setForm((prev) => ({
                        ...prev,
                        service_category_id: nextCategoryId,
                        service_type_label: nextOptions.includes(prev.service_type_label)
                          ? prev.service_type_label
                          : '',
                      }));
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      {t('providerDashboard.services.modal.categoryPlaceholder')}
                    </option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {categoryLabel(category.name_ar, category.name_en)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <RequiredLabel required className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.price')}
                  </RequiredLabel>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.starting_price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="10"
                    className={`${INPUT_CLASS} ${fieldErrors.starting_price ? 'border-red-300' : ''}`}
                    dir="ltr"
                  />
                  <FieldError message={fieldErrors.starting_price} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.serviceType')}
                  </label>
                  {serviceTypeOptions.length > 0 ? (
                    <select
                      value={form.service_type_label}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, service_type_label: e.target.value }))
                      }
                      className={INPUT_CLASS}
                    >
                      <option value="">
                        {t('providerDashboard.services.modal.serviceTypePlaceholder')}
                      </option>
                      {serviceTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.service_type_label}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, service_type_label: e.target.value }))
                      }
                      placeholder={t('providerDashboard.services.modal.serviceTypePlaceholder')}
                      className={INPUT_CLASS}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.duration')}
                  </label>
                  <input
                    type="text"
                    value={form.duration_label}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, duration_label: e.target.value }))
                    }
                    placeholder={t('providerDashboard.services.modal.durationPlaceholder')}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-gray-700">
                    {t('providerDashboard.services.modal.location')}
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder={t('providerDashboard.services.modal.locationPlaceholder')}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  {t('providerDashboard.services.modal.description')}
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t('providerDashboard.services.modal.descriptionPlaceholder')}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <h4 className="font-bold text-sm text-diyar-dark">
                    {t('providerDashboard.services.modal.activeTitle')}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {t('providerDashboard.services.modal.activeHint')}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_active}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-diyar-brown" />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
              >
                {t('providerDashboard.common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl font-bold bg-diyar-brown text-white hover:bg-[#856b54] transition disabled:opacity-60 flex items-center gap-2 cursor-pointer"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {t('providerDashboard.common.saveService')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-300 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" dir={dir}>
            <h3 className="font-bold text-lg text-diyar-dark">
              {t('providerDashboard.services.delete.title')}
            </h3>
            <p className="text-gray-600 text-sm">
              {t('providerDashboard.services.delete.description', { title: deleteTarget.title })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                {t('providerDashboard.common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteService.isPending}
                className="px-4 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 flex items-center gap-2 cursor-pointer"
              >
                {deleteService.isPending && <Loader2 size={16} className="animate-spin" />}
                {t('providerDashboard.common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
