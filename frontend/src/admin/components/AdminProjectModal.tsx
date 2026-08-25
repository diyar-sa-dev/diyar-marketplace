import { useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Trash2, Upload, X } from 'lucide-react';
import { uploadCmsImage } from '../../api/adminCms.ts';
import { AdminCmsImageField } from './AdminCmsImageField.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';

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
  images: ProjectImageFormValue[];
};

type AdminProjectModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: ProjectFormValues;
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

type ProjectFormProps = {
  mode: 'create' | 'edit';
  initial?: ProjectFormValues;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
};

function RequiredFieldLabel({ label }: { label: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label} <span className="text-red-500">*</span>
    </span>
  );
}

function ProjectForm({ mode, initial, isSaving, onClose, onSubmit }: ProjectFormProps) {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [year, setYear] = useState(initial?.year != null ? String(initial.year) : '');
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? '');
  const [images, setImages] = useState<ProjectImageFormValue[]>(initial?.images ?? []);
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const suggestedSlug = useMemo(() => slugifyName(title), [title]);
  const displaySlug = slugTouched ? slug : mode === 'edit' ? slug : suggestedSlug;

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
      const result = await uploadCmsImage(file, 'project_gallery');
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

    onSubmit({
      title: title.trim(),
      slug: displaySlug.trim(),
      description: description.trim(),
      category: category.trim(),
      location: location.trim(),
      year: year.trim() ? Number.parseInt(year, 10) : null,
      cover_image: coverImage.trim(),
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
          <p className="mt-1 text-sm text-gray-500">{t('admin.projects.slugHint')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="project-modal" dir={dir}>
        <div>
          <RequiredFieldLabel label={t('admin.tables.title')} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('admin.projects.placeholders.title')}
            data-testid="project-title"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir={dir}
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
            placeholder={suggestedSlug || t('admin.projects.placeholders.slug')}
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
            placeholder={t('admin.projects.placeholders.description')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir={dir}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredFieldLabel label={t('admin.projects.category')} />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              placeholder={t('admin.projects.placeholders.category')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir={dir}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.detail.vendor.location')}
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('admin.projects.placeholders.location')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir={dir}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.projects.deliveredYear')}
          </label>
          <input
            type="number"
            min={1900}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder={t('admin.projects.placeholders.year')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown sm:max-w-xs"
            dir="ltr"
          />
        </div>

        <AdminCmsImageField
          label={t('admin.projects.coverImage')}
          value={coverImage}
          onChange={setCoverImage}
          context="project_cover"
          uploading={uploadingCover}
          onUploadingChange={setUploadingCover}
          uploadLabel={t('admin.projects.upload')}
        />

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.projects.gallery')}
          </label>

          {images.length > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={`${image.image_url}-${index}`}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-gray-100 bg-gray-50"
                >
                  <img
                    src={image.image_url}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1 inset-s-1 flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => reorderImages(index, 'up')}
                      className="rounded-lg border border-gray-200 bg-white/90 p-1 text-gray-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => reorderImages(index, 'down')}
                      className="rounded-lg border border-gray-200 bg-white/90 p-1 text-gray-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 inset-e-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            disabled={uploadingGallery}
            onClick={() => galleryInputRef.current?.click()}
            className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-gray-400 transition-colors hover:border-diyar-brown/50 hover:bg-diyar-brown/5 disabled:opacity-60"
          >
            {uploadingGallery ? (
              <Loader2 size={22} className="animate-spin text-diyar-brown" />
            ) : (
              <>
                <div className="rounded-xl bg-white p-2 text-diyar-brown shadow-sm">
                  <Upload size={20} />
                </div>
                <span className="mt-2 text-sm font-bold text-diyar-dark">
                  {t('admin.projects.addImage')}
                </span>
                <span className="mt-1 text-xs text-gray-400">{t('admin.cmsImage.formats')}</span>
              </>
            )}
          </button>

          {images.length === 0 ? (
            <p className="mt-2 text-xs text-gray-500">{t('admin.projects.noImages')}</p>
          ) : null}

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleGalleryUpload(file);
              event.target.value = '';
            }}
          />
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
  isSaving,
  onClose,
  onSubmit,
}: AdminProjectModalProps) {
  const { t, dir } = useLocale();

  if (!open) return null;

  const formKey = `${mode}-${initial?.slug ?? 'new'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
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
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
