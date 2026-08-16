import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Home,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { SaudiPhoneInput } from '../components/auth/SaudiPhoneInput.tsx';
import { useToast } from '../hooks/useToast.ts';
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '../hooks/profile/useProfile.ts';
import {
  isValidSaudiPhoneNational,
  sanitizeSaudiPhoneInput,
  toSaudiPhoneNationalInput,
} from '../lib/auth/validation.ts';
import { useLocale } from '../lib/i18n/localeContext.ts';
import type { AddressType, StoreAddressPayload, UserAddress } from '../types/profile.ts';
import { collectDisplayErrors, isUnexpectedServerError } from '../utils/errors.ts';

type ModalMode = 'add' | 'edit';

type AddressFormState = {
  id: string | null;
  label: string;
  type: AddressType;
  recipient_name: string;
  phone: string;
  city: string;
  district: string;
  street: string;
  building: string;
  apartment: string;
  is_default: boolean;
};

const emptyFormState = (): AddressFormState => ({
  id: null,
  label: '',
  type: 'home',
  recipient_name: '',
  phone: '',
  city: '',
  district: '',
  street: '',
  building: '',
  apartment: '',
  is_default: false,
});

function addressToFormState(address: UserAddress): AddressFormState {
  return {
    id: address.id,
    label: address.label,
    type: address.type,
    recipient_name: address.recipient_name,
    phone: sanitizeSaudiPhoneInput(address.phone),
    city: address.city ?? '',
    district: address.district ?? '',
    street: address.street ?? '',
    building: address.building ?? '',
    apartment: address.apartment ?? '',
    is_default: address.is_default,
  };
}

function buildPayload(formData: AddressFormState): StoreAddressPayload {
  return {
    label: formData.label.trim(),
    type: formData.type,
    recipient_name: formData.recipient_name.trim(),
    phone: formData.phone.trim(),
    city: formData.city.trim() || undefined,
    district: formData.district.trim() || undefined,
    street: formData.street.trim() || undefined,
    building: formData.building.trim() || undefined,
    apartment: formData.apartment.trim() || undefined,
    is_default: formData.is_default,
  };
}

export default function AddressesPage() {
  const { toast } = useToast();
  const { t, locale, dir } = useLocale();
  const BreadcrumbChevron = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const addressesQuery = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('add');
  const [formData, setFormData] = useState<AddressFormState>(emptyFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const addresses = addressesQuery.data ?? [];
  const isSubmitting = createAddress.isPending || updateAddress.isPending;
  const isActionPending = deleteAddress.isPending || setDefaultAddress.isPending;
  const saudiPhoneHint = t('validation.saudiPhoneHint');

  useEffect(() => {
    if (!addressesQuery.error) {
      return;
    }

    if (isUnexpectedServerError(addressesQuery.error, locale)) {
      const { message } = collectDisplayErrors(addressesQuery.error, locale);
      setFatalError(new Error(message));
      return;
    }

    const { message } = collectDisplayErrors(addressesQuery.error, locale);
    toast.error(message ?? t('profile.addresses.loadError'));
  }, [addressesQuery.error, locale, t, toast]);

  if (fatalError) {
    throw fatalError;
  }

  const resetFormErrors = () => {
    setFormError(null);
    setFieldErrors([]);
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData(emptyFormState());
    resetFormErrors();
    setIsModalOpen(true);
  };

  const openEditModal = (address: UserAddress) => {
    setModalMode('edit');
    setFormData(addressToFormState(address));
    resetFormErrors();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    setIsModalOpen(false);
    resetFormErrors();
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target;
    const { name, value, type } = target;
    const nextValue = type === 'checkbox' ? (target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetFormErrors();

    if (!isValidSaudiPhoneNational(formData.phone.trim())) {
      setFormError(saudiPhoneHint);
      toast.warning(saudiPhoneHint);
      return;
    }

    const payload = buildPayload(formData);

    try {
      if (modalMode === 'add') {
        const result = await createAddress.mutateAsync(payload);
        toast.success(result.message ?? t('profile.addresses.createSuccess'));
      } else if (formData.id) {
        const result = await updateAddress.mutateAsync({ id: formData.id, payload });
        toast.success(result.message ?? t('profile.addresses.updateSuccess'));
      }
      setIsModalOpen(false);
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        const { message } = collectDisplayErrors(error, locale);
        setFatalError(new Error(message));
        return;
      }

      const { message, fieldMessages } = collectDisplayErrors(error, locale);
      setFormError(message);
      setFieldErrors(fieldMessages);
      toast.error(message);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const result = await setDefaultAddress.mutateAsync(id);
      toast.success(result.message ?? t('profile.addresses.defaultSuccess'));
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        const { message } = collectDisplayErrors(error, locale);
        setFatalError(new Error(message));
        return;
      }
      const { message } = collectDisplayErrors(error, locale);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('profile.addresses.confirmDelete'))) {
      return;
    }

    try {
      const message = await deleteAddress.mutateAsync(id);
      toast.success(message ?? t('profile.addresses.deleteSuccess'));
    } catch (error) {
      if (isUnexpectedServerError(error, locale)) {
        const { message } = collectDisplayErrors(error, locale);
        setFatalError(new Error(message));
        return;
      }
      const { message } = collectDisplayErrors(error, locale);
      toast.error(message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24 md:pb-12">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link to="/" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.home')}
            </Link>
            <BreadcrumbChevron size={16} />
            <Link to="/profile" className="hover:text-diyar-dark transition cursor-pointer">
              {t('common.myAccount')}
            </Link>
            <BreadcrumbChevron size={16} />
            <span className="font-bold text-diyar-dark">{t('profile.addresses.title')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-diyar-dark mb-1">
              {t('profile.addresses.title')}
            </h1>
            <p className="text-gray-500 text-sm">{t('profile.addresses.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            disabled={addressesQuery.isLoading}
            className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>{t('profile.addresses.addNew')}</span>
          </button>
        </div>

        {addressesQuery.isLoading ? (
          <div className="flex justify-center py-24">
            <span className="inline-block w-8 h-8 border-2 border-diyar-dark/20 border-t-diyar-dark rounded-full animate-spin" />
          </div>
        ) : addressesQuery.isError ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-red-100">
            <p className="text-red-700 font-medium mb-4">{t('profile.addresses.loadError')}</p>
            <button
              type="button"
              onClick={() => void addressesQuery.refetch()}
              className="bg-diyar-dark text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-colors cursor-pointer"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl p-5 border-2 transition-all ${
                  address.is_default
                    ? 'border-diyar-brown shadow-md relative'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {address.is_default && (
                  <div className="absolute top-0 inset-e-5 -mt-3 bg-diyar-brown text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} />
                    <span>{t('profile.addresses.defaultBadge')}</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        address.type === 'home'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {address.type === 'home' ? <Home size={24} /> : <Briefcase size={24} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-diyar-dark text-lg">{address.label}</h3>
                      <p className="text-sm text-gray-500">{address.recipient_name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-4 mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed mb-3 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-1 shrink-0" />
                    <span>{address.formatted_summary}</span>
                  </p>
                  <p className="text-gray-600 text-sm" dir="ltr">
                    +966 {toSaudiPhoneNationalInput(address.phone)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(address.id)}
                      disabled={isActionPending}
                      className="flex-1 bg-gray-50 text-gray-700 font-bold text-sm py-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('profile.addresses.setDefault')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditModal(address)}
                    disabled={isActionPending}
                    aria-label={t('profile.addresses.edit')}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-diyar-dark hover:bg-gray-50 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Edit2 size={18} />
                  </button>
                  {!address.is_default && (
                    <button
                      type="button"
                      onClick={() => void handleDelete(address.id)}
                      disabled={isActionPending}
                      aria-label={t('profile.addresses.delete')}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
              <MapPin size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-bold text-diyar-dark">{t('profile.addresses.empty')}</h3>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-diyar-dark">
                {modalMode === 'add'
                  ? t('profile.addresses.addNew')
                  : t('profile.addresses.edit')}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="w-10 h-10 bg-gray-50 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-diyar-dark transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-hide p-5 md:p-6">
              {(formError || fieldErrors.length > 0) && (
                <div className="mb-5 space-y-2">
                  {formError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {formError}
                    </div>
                  )}
                  {fieldErrors.length > 0 && (
                    <ul className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 list-disc list-inside space-y-1">
                      {fieldErrors.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" id="address-form">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.label')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="label"
                      required
                      value={formData.label}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.type')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors appearance-none cursor-pointer"
                    >
                      <option value="home">{t('profile.addresses.typeHome')}</option>
                      <option value="work">{t('profile.addresses.typeWork')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('profile.addresses.recipient')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="recipient_name"
                    required
                    value={formData.recipient_name}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('profile.addresses.phone')} <span className="text-red-500">*</span>
                  </label>
                  <SaudiPhoneInput
                    id="address-phone"
                    value={formData.phone}
                    onChange={(phone) => setFormData((prev) => ({ ...prev, phone }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.city')}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.district')}
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('profile.addresses.street')}
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.building')}
                    </label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t('profile.addresses.apartment')}
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:border-diyar-dark focus:ring-1 focus:ring-diyar-dark transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={handleChange}
                    className="w-5 h-5 rounded text-diyar-dark focus:ring-diyar-dark border-gray-300 accent-diyar-dark cursor-pointer"
                  />
                  <label
                    htmlFor="is_default"
                    className="text-sm font-bold text-gray-700 cursor-pointer"
                  >
                    {t('profile.addresses.setAsDefault')}
                  </label>
                </div>
              </form>
            </div>

            <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {t('profile.addresses.cancel')}
              </button>
              <button
                type="submit"
                form="address-form"
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-diyar-dark hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : modalMode === 'add' ? (
                  t('profile.addresses.submitAdd')
                ) : (
                  t('profile.addresses.submitEdit')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
