import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload, X } from 'lucide-react';
import { uploadCmsImage } from '../../api/adminCms.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ProjectPublicationStatus } from '../../types/project.ts';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal.ts';

export type ProjectImageFormValue = {
  image_url: string;
  alt: string;
  sort_order: number;
};

export type ProjectFormValues = {
  title: string;
  slug: string;
  description: string;
  category: string;
  location: string;
  year: number | null;
  cover_image: string;
  status: ProjectPublicationStatus;
  published_at: string;
  images: ProjectImageFormValue[];
};

type AdminProjectModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ProjectFormValues;
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
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

function uniqueSlug(base: string, existing: string[], ignore?: string): string {
  if (!base) return '';
  const taken = new Set(existing.filter((s) => s !== ignore));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

type ProjectFormProps = {
  mode: 'create' | 'edit';
  initial?: ProjectFormValues;
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
};

function ProjectForm({
  mode,
  initial,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: ProjectFormProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [year, setYear] = useState(initial?.year != null ? String(initial.year) : '');
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? '');
  const [status, setStatus] = useState<ProjectPublicationStatus>(initial?.status ?? 'draft');
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocalValue(initial?.published_at));
  const [images, setImages] = useState<ProjectImageFormValue[]>(initial?.images ?? []);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const suggestedSlug = useMemo(() => {
    const base = slugifyName(title);
    return uniqueSlug(base, existingSlugs, mode === 'edit' ? currentSlug : undefined);
  }, [title, existingSlugs, mode, currentSlug]);

  const displaySlug = slugTouched ? slug : suggestedSlug;

  const reorderImages = (index: number, direction: 'up' | 'down') => {
    setImages((current) => {
      const next = [...current];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return current;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((image, sortOrder) => ({ ...image, sort_order: sortOrder }));
    });
  };

  const removeImage = (index: number) => {
    setImages((current) =>
      current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, sortOrder) => ({ ...image, sort_order: sortOrder })),
    );
  };

  const handleGalleryUpload = async (file: File) => {
    setUploadingGallery(true);
    try {
      const result = await uploadCmsImage(file, 'project-gallery');
      setImages((current) => [
        ...current,
        {
          image_url: result.url,
          alt: file.name.replace(/\.[^.]+$/, ''),
          sort_order: current.length,
        },
      ]);
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('admin.projects.uploadError'));
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedSlug = displaySlug.trim();
    const finalSlug = trimmedSlug
      ? uniqueSlug(trimmedSlug, existingSlugs, mode === 'edit' ? currentSlug : undefined)
      : suggestedSlug;

    onSubmit({
      title: title.trim(),
      slug: finalSlug,
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      year: year.trim() ? Number.parseInt(year, 10) : null,
      cover_image: coverImage.trim(),
      status,
      published_at: publishedAt,
      images: images.map((image, index) => ({
        ...image,
        sort_order: index,
      })),
    });
  };

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-diyar-dark">
            {mode === 'create' ? t('admin.projects.createTitle') : t('admin.projects.editTitle')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">{t('admin.categories.modalHint')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="project-modal">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.title')}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-testid="project-title"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.slug')}
          </label>
          <input
            value={displaySlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder={suggestedSlug || t('admin.categories.slugAuto')}
            data-testid="project-slug"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.projects.description')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.projects.category')}
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.detail.vendor.location')}
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.projects.year')}
            </label>
            <input
              type="number"
              min={1900}
              max={2100}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.tables.status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectPublicationStatus)}
              data-testid="project-status"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="draft">{t('admin.status.draft')}</option>
              <option value="published">{t('admin.status.published')}</option>
              <option value="archived">{t('admin.status.archived')}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.projects.coverImage')}
          </label>
          <div className="flex gap-2">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setUploadingCover(true);
                void uploadCmsImage(file, 'project-cover')
                  .then((result) => setCoverImage(result.url))
                  .catch((error) => {
                    toast.error(
                      parseApiError(error, locale).message || t('admin.projects.uploadError'),
                    );
                  })
                  .finally(() => setUploadingCover(false));
                event.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={uploadingCover}
              onClick={() => coverInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer"
            >
              {uploadingCover ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {t('admin.projects.upload')}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.projects.publishedAt')}
          </label>
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.projects.gallery')}
            </label>
            <div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleGalleryUpload(file);
                  }
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={uploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 cursor-pointer"
              >
                {uploadingGallery ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {t('admin.projects.addImage')}
              </button>
            </div>
          </div>
          {images.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-xs text-gray-500">
              {t('admin.projects.noImages')}
            </p>
          ) : (
            <div className="space-y-2">
              {images.map((image, index) => (
                <div
                  key={`${image.image_url}-${index}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-2"
                >
                  <img
                    src={image.image_url}
                    alt={image.alt}
                    className="h-12 w-12 rounded-lg border border-gray-100 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      value={image.alt}
                      onChange={(event) => {
                        const alt = event.target.value;
                        setImages((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index ? { ...entry, alt } : entry,
                          ),
                        );
                      }}
                      placeholder={t('admin.projects.imageAlt')}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-diyar-brown"
                    />
                    <p className="mt-1 truncate font-mono text-[10px] text-gray-400" dir="ltr">
                      #{index + 1} · {image.image_url}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => reorderImages(index, 'up')}
                      className="rounded-lg border border-gray-200 p-1 text-gray-500 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => reorderImages(index, 'down')}
                      className="rounded-lg border border-gray-200 p-1 text-gray-500 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-lg border border-red-200 p-1 text-red-600 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !category.trim() || isSaving}
            data-testid="project-submit"
            className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'create' ? t('admin.projects.create') : t('admin.projects.edit')}
          </button>
        </div>
      </form>
    </>
  );
}

export function AdminProjectModal({
  open,
  mode,
  initial,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: AdminProjectModalProps) {
  const { t } = useLocale();

  if (!open) return null;

  const formKey = `${mode}-${currentSlug ?? initial?.slug ?? 'new'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label={t('common.cancel')}
      />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <ProjectForm
          key={formKey}
          mode={mode}
          initial={initial}
          existingSlugs={existingSlugs}
          currentSlug={currentSlug}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
