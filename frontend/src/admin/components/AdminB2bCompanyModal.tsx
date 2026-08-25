import { useMemo, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { AdminCmsImageField } from './AdminCmsImageField.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import type { B2bCategory, B2bTag } from '../../types/b2b.ts';

export type B2bServiceFormValue = {
  name: string;
  description: string;
};

export type B2bCompanyFormValues = {
  name: string;
  slug: string;
  b2b_category_id: string;
  description: string;
  about: string;
  logo: string;
  cover_image: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  years_experience: number | null;
  team_size: number | null;
  completed_projects: number | null;
  rating: number | null;
  reviews_count: number | null;
  tag_ids: string[];
  services: B2bServiceFormValue[];
};

type AdminB2bCompanyModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: B2bCompanyFormValues;
  categories: B2bCategory[];
  tags: B2bTag[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: B2bCompanyFormValues) => void;
};

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function RequiredFieldLabel({ label }: { label: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label} <span className="text-red-500">*</span>
    </span>
  );
}

export function AdminB2bCompanyModal({
  open,
  mode,
  initial,
  categories,
  tags,
  isSaving,
  onClose,
  onSubmit,
}: AdminB2bCompanyModalProps) {
  const { t, dir } = useLocale();

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [categoryId, setCategoryId] = useState(initial?.b2b_category_id ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [about, setAbout] = useState(initial?.about ?? '');
  const [logo, setLogo] = useState(initial?.logo ?? '');
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [services, setServices] = useState<B2bServiceFormValue[]>(
    initial?.services?.length ? initial.services : [{ name: '', description: '' }],
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const suggestedSlug = useMemo(() => slugifyName(name), [name]);
  const displaySlug = slugTouched ? slug : mode === 'edit' ? slug : suggestedSlug;

  if (!open) return null;

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      slug: displaySlug.trim(),
      b2b_category_id: categoryId,
      description: description.trim(),
      about: about.trim(),
      logo: logo.trim(),
      cover_image: coverImage.trim(),
      location: location.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      years_experience: initial?.years_experience ?? null,
      team_size: initial?.team_size ?? null,
      completed_projects: initial?.completed_projects ?? 0,
      rating: initial?.rating ?? 0,
      reviews_count: initial?.reviews_count ?? 0,
      tag_ids: selectedTagIds,
      services: services.filter((service) => service.name.trim() !== ''),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      dir={dir}
      role="dialog"
      aria-modal="true"
      aria-labelledby="b2b-company-modal-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="b2b-company-modal-title" className="text-lg font-bold text-diyar-dark">
            {mode === 'create' ? t('admin.b2b.createTitle') : t('admin.b2b.editTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-diyar-dark cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <RequiredFieldLabel label={t('admin.b2b.fields.name')} />
                <input
                  data-testid="b2b-company-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.tables.slug')}
                </span>
                <input
                  data-testid="b2b-company-slug"
                  value={displaySlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.b2b.fields.category')}
              </span>
              <select
                data-testid="b2b-company-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              >
                <option value="">{t('admin.b2b.fields.noCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.b2b.fields.description')}
              </span>
              <textarea
                data-testid="b2b-company-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.b2b.fields.about')}
              </span>
              <textarea
                data-testid="b2b-company-about"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminCmsImageField
                label={t('admin.b2b.fields.logo')}
                value={logo}
                onChange={setLogo}
                context="b2b_logo"
                uploading={uploadingLogo}
                onUploadingChange={setUploadingLogo}
                uploadLabel={t('admin.cmsImage.replace')}
              />
              <AdminCmsImageField
                label={t('admin.b2b.fields.cover')}
                value={coverImage}
                onChange={setCoverImage}
                context="b2b_cover"
                uploading={uploadingCover}
                onUploadingChange={setUploadingCover}
                uploadLabel={t('admin.cmsImage.replace')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.detail.vendor.location')}
                </span>
                <input
                  data-testid="b2b-company-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.b2b.fields.phone')}
                </span>
                <input
                  data-testid="b2b-company-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                  dir="ltr"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.b2b.fields.email')}
                </span>
                <input
                  data-testid="b2b-company-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                  dir="ltr"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.b2b.fields.website')}
                </span>
                <input
                  data-testid="b2b-company-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
                  dir="ltr"
                />
              </label>
            </div>

            {tags.length > 0 ? (
              <div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.b2b.fields.tags')}
                </span>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition ${
                          active
                            ? 'border-diyar-brown bg-diyar-cream/40 text-diyar-dark'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-diyar-brown/40'
                        }`}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {t('admin.b2b.fields.services')}
                </span>
                <button
                  type="button"
                  onClick={() => setServices((current) => [...current, { name: '', description: '' }])}
                  className="inline-flex items-center gap-1 text-xs font-bold text-diyar-brown cursor-pointer"
                >
                  <Plus size={14} /> {t('admin.b2b.addService')}
                </button>
              </div>
              <div className="space-y-2">
                {services.map((service, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      value={service.name}
                      onChange={(e) =>
                        setServices((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, name: e.target.value } : item,
                          ),
                        )
                      }
                      placeholder={t('admin.b2b.serviceNamePlaceholder')}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-diyar-brown"
                    />
                    <button
                      type="button"
                      onClick={() => setServices((current) => current.filter((_, i) => i !== index))}
                      className="rounded-xl border border-gray-200 p-2 text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || uploadingLogo || uploadingCover}
              data-testid="b2b-company-submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-diyar-dark px-5 py-2.5 text-sm font-bold text-white hover:bg-diyar-brown disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === 'create' ? t('admin.b2b.create') : t('admin.b2b.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
