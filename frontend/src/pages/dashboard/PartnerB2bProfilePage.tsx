import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, ExternalLink, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { SaudiPhoneInput } from '../../components/auth/SaudiPhoneInput.tsx';
import { PartnerB2bFormSection } from '../../components/dashboard/b2b/PartnerB2bFormSection.tsx';
import { PartnerB2bImageField } from '../../components/dashboard/b2b/PartnerB2bImageField.tsx';
import { PartnerB2bLeadsPanel } from '../../components/dashboard/b2b/PartnerB2bLeadsPanel.tsx';
import { PartnerB2bPortfolioGallery } from '../../components/dashboard/b2b/PartnerB2bPortfolioGallery.tsx';
import { PartnerB2bTagPicker } from '../../components/dashboard/b2b/PartnerB2bTagPicker.tsx';
import { ErrorState } from '../../components/common/ErrorState.tsx';
import {
  usePartnerB2bCompany,
  useSavePartnerB2bCompany,
} from '../../hooks/b2b/usePartnerB2bCompany.ts';
import { usePartnerB2bCategories } from '../../hooks/b2b/usePartnerB2bCategories.ts';
import { usePartnerB2bTags } from '../../hooks/b2b/usePartnerB2bTags.ts';
import {
  B2B_CATEGORY_OTHER,
  formatB2bPhoneForApi,
  isValidB2bEmail,
  isValidB2bPhone,
  isValidB2bWebsite,
  normalizeB2bWebsite,
  readB2bPhoneNational,
} from '../../lib/b2bFormValidation.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { B2bCompanyPortfolioImage, PartnerB2bPortal } from '../../types/b2b.ts';
import { parseApiError } from '../../utils/errors.ts';

type PartnerB2bProfilePageProps = {
  portal: PartnerB2bPortal;
};

type ServiceDraft = {
  name: string;
  description: string;
};

const TEAM_SIZE_VALUES = [10, 20, 50, 100, 150] as const;

type PartnerTab = 'leads' | 'profile';

const TAB_IDS: PartnerTab[] = ['leads', 'profile'];

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-diyar-brown/30';

const inputErrorClassName =
  'w-full rounded-xl border border-red-300 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200';

export default function PartnerB2bProfilePage({ portal }: PartnerB2bProfilePageProps) {
  const { t } = useLocale();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: company, isPending, isError, error, refetch } = usePartnerB2bCompany(portal);
  const { data: categories } = usePartnerB2bCategories(portal);
  const { data: availableTags } = usePartnerB2bTags(portal);
  const saveCompany = useSavePartnerB2bCompany(portal);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [about, setAbout] = useState('');
  const [logo, setLogo] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [completedProjects, setCompletedProjects] = useState('');
  const [services, setServices] = useState<ServiceDraft[]>([{ name: '', description: '' }]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [customTagNames, setCustomTagNames] = useState<string[]>([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [portfolioImages, setPortfolioImages] = useState<B2bCompanyPortfolioImage[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!company) return;

    setName(company.name ?? '');
    if (company.custom_category) {
      setCategoryId(B2B_CATEGORY_OTHER);
      setCustomCategory(company.custom_category);
    } else {
      setCategoryId(company.b2b_category_id ?? company.category?.id ?? '');
      setCustomCategory('');
    }
    setDescription(company.description ?? '');
    setAbout(company.about ?? '');
    setLogo(company.logo ?? '');
    setCoverImage(company.cover_image ?? '');
    setLocation(company.location ?? '');
    setPhone(readB2bPhoneNational(company.phone));
    setEmail(company.email ?? '');
    setWebsite(company.website?.replace(/^https?:\/\//i, '') ?? '');
    setBusinessHours(company.business_hours ?? '');
    setYearsExperience(
      company.years_experience?.toString() ?? company.stats.years_experience?.toString() ?? '',
    );
    setTeamSize(company.team_size?.toString() ?? company.stats.team_size?.toString() ?? '');
    setCompletedProjects(
      company.completed_projects?.toString() ?? company.stats.completed_projects?.toString() ?? '',
    );
    setServices(
      company.services && company.services.length > 0
        ? company.services.map((service) => ({
            name: service.name,
            description: service.description ?? '',
          }))
        : [{ name: '', description: '' }],
    );
    setPortfolioImages(company.portfolio_gallery ?? []);
    setSelectedTagIds(company.tag_ids ?? company.tags?.map((tag) => tag.id) ?? []);
    setCustomTagNames([]);
  }, [company]);

  const companyExists = Boolean(company);
  const isPublished = company?.publication_status === 'published';
  const isUploadingMedia = uploadingLogo || uploadingCover;

  const activeTab = useMemo<PartnerTab>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile') return 'profile';
    if (isPublished && tab === 'leads') return 'leads';
    return isPublished ? 'leads' : 'profile';
  }, [isPublished, searchParams]);

  const selectTab = (tab: PartnerTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  const tabClass = (active: boolean) =>
    `shrink-0 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
      active
        ? 'bg-diyar-dark text-white shadow-sm'
        : 'text-gray-500 hover:text-diyar-brown hover:bg-gray-50'
    }`;

  const statusLabel = useMemo(() => {
    if (!company) return null;
    return t(`b2b.partner.status.${company.publication_status ?? 'draft'}`);
  }, [company, t]);

  const verificationLabel = useMemo(() => {
    if (!company) return null;
    return t(`b2b.partner.verification.${company.verification_status ?? 'pending'}`);
  }, [company, t]);

  const updateService = (index: number, patch: Partial<ServiceDraft>) => {
    setServices((current) =>
      current.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, ...patch } : service,
      ),
    );
  };

  const addService = () => {
    setServices((current) => [...current, { name: '', description: '' }]);
  };

  const removeService = (index: number) => {
    setServices((current) => current.filter((_, serviceIndex) => serviceIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldErrors({});

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error(t('b2b.partner.nameRequired'));
      return;
    }

    const nextErrors: Record<string, string> = {};
    const trimmedCustomCategory = customCategory.trim();
    const isOtherCategory = categoryId === B2B_CATEGORY_OTHER;

    if (isOtherCategory && trimmedCustomCategory.length < 2) {
      nextErrors.customCategory = t('b2b.partner.validation.customCategoryRequired');
    }

    if (phone.trim() && !isValidB2bPhone(phone)) {
      nextErrors.phone = t('b2b.partner.validation.invalidPhone');
    }

    if (email.trim() && !isValidB2bEmail(email)) {
      nextErrors.email = t('b2b.partner.validation.invalidEmail');
    }

    if (website.trim() && !isValidB2bWebsite(website)) {
      nextErrors.website = t('b2b.partner.validation.invalidWebsite');
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    const cleanedServices = services
      .map((service) => ({
        name: service.name.trim(),
        description: service.description.trim() || null,
      }))
      .filter((service) => service.name.length > 0);

    const payload = {
      name: trimmedName,
      b2b_category_id: isOtherCategory ? null : categoryId || null,
      custom_category: isOtherCategory ? trimmedCustomCategory : null,
      description: description.trim() || null,
      about: about.trim() || null,
      logo: logo.trim() || null,
      cover_image: coverImage.trim() || null,
      location: location.trim() || null,
      phone: formatB2bPhoneForApi(phone),
      email: email.trim() || null,
      website: normalizeB2bWebsite(website),
      business_hours: businessHours.trim() || null,
      years_experience: yearsExperience ? Number(yearsExperience) : null,
      team_size: teamSize ? Number(teamSize) : null,
      completed_projects: completedProjects ? Number(completedProjects) : null,
      tag_ids: selectedTagIds,
      tag_names: customTagNames,
      services: cleanedServices,
    };

    try {
      await saveCompany.mutateAsync({ companyExists, payload });
      toast.success(companyExists ? t('b2b.partner.saved') : t('b2b.partner.created'));
    } catch (err) {
      toast.error(parseApiError(err).message ?? t('b2b.partner.saveError'));
    }
  };

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-diyar-cream/30 text-diyar-brown flex items-center justify-center">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-diyar-dark">{t('b2b.partner.title')}</h1>
            <p className="text-sm text-gray-500">{t('b2b.partner.subtitle')}</p>
          </div>
        </div>

        {company ? (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700">
              {statusLabel}
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {verificationLabel}
            </span>
            {isPublished && company.slug ? (
              <Link
                to={`/b2b/${company.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-diyar-brown hover:underline"
              >
                {t('b2b.partner.viewPublic')}
                <ExternalLink size={14} />
              </Link>
            ) : company?.slug ? (
              <span className="text-xs text-gray-500">{t('b2b.partner.publicPreviewPending')}</span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-3">{t('b2b.partner.emptyHint')}</p>
        )}
      </div>

      {isPublished ? (
        <div className="inline-flex w-fit max-w-full overflow-x-auto gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm mb-6">
          {TAB_IDS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => selectTab(tab)}
              className={tabClass(activeTab === tab)}
            >
              {t(`b2b.partner.tabs.${tab}`)}
            </button>
          ))}
        </div>
      ) : null}

      {isPending ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-diyar-brown" />
        </div>
      ) : isPublished && activeTab === 'leads' ? (
        <PartnerB2bLeadsPanel portal={portal} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <PartnerB2bFormSection
            title={t('b2b.partner.sections.identity.title')}
            description={t('b2b.partner.sections.identity.description')}
          >
            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.name')} <span className="text-diyar-brown">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClassName}
                placeholder={t('b2b.partner.placeholders.name')}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.category')}
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (e.target.value !== B2B_CATEGORY_OTHER) {
                    setCustomCategory('');
                  }
                }}
                className={inputClassName}
              >
                <option value="">{t('b2b.partner.noCategory')}</option>
                {(categories ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value={B2B_CATEGORY_OTHER}>{t('b2b.partner.otherCategory')}</option>
              </select>
              {categoryId === B2B_CATEGORY_OTHER ? (
                <input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={fieldErrors.customCategory ? inputErrorClassName : inputClassName}
                  placeholder={t('b2b.partner.placeholders.customCategory')}
                />
              ) : null}
              {fieldErrors.customCategory ? (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.customCategory}</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">{t('b2b.partner.categoryHint')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.description')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClassName}
                placeholder={t('b2b.partner.placeholders.description')}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.about')}
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={5}
                className={inputClassName}
                placeholder={t('b2b.partner.placeholders.about')}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.tags')}
              </label>
              <PartnerB2bTagPicker
                availableTags={availableTags ?? []}
                selectedTagIds={selectedTagIds}
                customTagNames={customTagNames}
                onSelectedTagIdsChange={setSelectedTagIds}
                onCustomTagNamesChange={setCustomTagNames}
                disabled={saveCompany.isPending || isUploadingMedia}
              />
            </div>
          </PartnerB2bFormSection>

          <PartnerB2bFormSection
            title={t('b2b.partner.sections.media.title')}
            description={t('b2b.partner.sections.media.description')}
          >
            <div className="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-6 items-start">
              <PartnerB2bImageField
                portal={portal}
                type="logo"
                variant="logo"
                label={t('b2b.partner.fields.logo')}
                hint={t('b2b.partner.mediaHints.logo')}
                value={logo}
                onChange={setLogo}
                uploading={uploadingLogo}
                onUploadingChange={setUploadingLogo}
              />
              <PartnerB2bImageField
                portal={portal}
                type="cover"
                variant="cover"
                label={t('b2b.partner.fields.cover')}
                hint={t('b2b.partner.mediaHints.cover')}
                value={coverImage}
                onChange={setCoverImage}
                uploading={uploadingCover}
                onUploadingChange={setUploadingCover}
              />
            </div>
          </PartnerB2bFormSection>

          <PartnerB2bFormSection
            title={t('b2b.partner.sections.contact.title')}
            description={t('b2b.partner.sections.contact.description')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.location')}
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClassName}
                  placeholder={t('b2b.partner.placeholders.location')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.phone')}
                </label>
                <SaudiPhoneInput id="partner-b2b-phone" value={phone} onChange={setPhone} required={false} />
                {fieldErrors.phone ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">{t('validation.saudiPhoneHint')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldErrors.email ? inputErrorClassName : inputClassName}
                  placeholder={t('b2b.partner.placeholders.email')}
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.website')}
                </label>
                <div className="relative flex min-w-0" dir="ltr">
                  <div className="flex items-center justify-center shrink-0 rounded-l-xl border border-gray-200 border-e-0 bg-gray-50 px-3 text-sm font-bold text-gray-600">
                    https://
                  </div>
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value.replace(/^https?:\/\//i, ''))}
                    className={`min-w-0 flex-1 rounded-r-xl border py-3 pl-3 pr-3 text-sm outline-none transition-colors focus:ring-2 ${
                      fieldErrors.website
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                        : 'border-gray-200 focus:border-diyar-brown focus:ring-diyar-brown/30'
                    }`}
                    placeholder={t('b2b.partner.placeholders.website')}
                    dir="ltr"
                  />
                </div>
                {fieldErrors.website ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.website}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-diyar-dark mb-2">
                {t('b2b.partner.fields.businessHours')}
              </label>
              <input
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className={inputClassName}
                placeholder={t('b2b.partner.placeholders.businessHours')}
              />
            </div>
          </PartnerB2bFormSection>

          <PartnerB2bFormSection
            title={t('b2b.partner.sections.stats.title')}
            description={t('b2b.partner.sections.stats.description')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.yearsExperience')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className={inputClassName}
                  placeholder={t('b2b.partner.placeholders.yearsExperience')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.completedProjects')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={completedProjects}
                  onChange={(e) => setCompletedProjects(e.target.value)}
                  className={inputClassName}
                  placeholder={t('b2b.partner.placeholders.completedProjects')}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-diyar-dark mb-2">
                  {t('b2b.partner.fields.teamSize')}
                </label>
                <select
                  value={teamSize}
                  onChange={(e) => setTeamSize(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">{t('b2b.partner.placeholders.teamSize')}</option>
                  {TEAM_SIZE_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {t(`b2b.partner.teamSizeOptions.${value}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </PartnerB2bFormSection>

          <PartnerB2bFormSection
            title={t('b2b.partner.sections.services.title')}
            description={t('b2b.partner.sections.services.description')}
          >
            <div className="space-y-3">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <input
                        value={service.name}
                        onChange={(e) => updateService(index, { name: e.target.value })}
                        className={inputClassName}
                        placeholder={t('b2b.partner.placeholders.serviceName')}
                      />
                      <input
                        value={service.description}
                        onChange={(e) => updateService(index, { description: e.target.value })}
                        className={inputClassName}
                        placeholder={t('b2b.partner.placeholders.serviceDescription')}
                      />
                    </div>
                    {services.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50 cursor-pointer"
                        aria-label={t('b2b.partner.removeService')}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-2 text-sm font-bold text-diyar-brown hover:text-diyar-dark cursor-pointer"
            >
              <Plus size={16} /> {t('b2b.partner.addService')}
            </button>
          </PartnerB2bFormSection>

          <PartnerB2bFormSection
            title={t('b2b.partner.sections.portfolio.title')}
            description={t('b2b.partner.sections.portfolio.description')}
          >
            <PartnerB2bPortfolioGallery
              portal={portal}
              images={portfolioImages}
              companyExists={companyExists}
              isPublished={isPublished}
              onChange={setPortfolioImages}
              disabled={saveCompany.isPending || isUploadingMedia}
            />
          </PartnerB2bFormSection>

          <p className="text-xs text-gray-500 px-1">{t('b2b.partner.reviewHint')}</p>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveCompany.isPending || isUploadingMedia}
              className="inline-flex items-center gap-2 bg-diyar-brown text-white font-bold px-5 py-3 rounded-xl hover:bg-diyar-dark transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saveCompany.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {companyExists ? t('b2b.partner.save') : t('b2b.partner.create')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
