import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

export type CategoryFormValues = {
  name: string;
  slug: string;
  type: 'product' | 'service';
  is_active: boolean;
};

type AdminCategoryModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: CategoryFormValues;
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
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

type CategoryFormProps = {
  mode: 'create' | 'edit';
  initial?: CategoryFormValues;
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => void;
};

function CategoryForm({
  mode,
  initial,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: CategoryFormProps) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [type, setType] = useState<'product' | 'service'>(initial?.type ?? 'product');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [slugTouched, setSlugTouched] = useState(false);

  const suggestedSlug = useMemo(() => {
    const base = slugifyName(name);
    return uniqueSlug(base, existingSlugs, mode === 'edit' ? currentSlug : undefined);
  }, [name, existingSlugs, mode, currentSlug]);

  const displaySlug = slugTouched ? slug : suggestedSlug;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedSlug = displaySlug.trim();
    const finalSlug = trimmedSlug
      ? uniqueSlug(trimmedSlug, existingSlugs, mode === 'edit' ? currentSlug : undefined)
      : suggestedSlug;

    onSubmit({
      name: name.trim(),
      slug: finalSlug,
      type,
      is_active: isActive,
    });
  };

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-diyar-dark">
            {mode === 'create' ? t('admin.categories.addTitle') : t('admin.categories.editTitle')}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.name')}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
          {suggestedSlug ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('admin.categories.slugSuggestion')}:{' '}
              <span className="font-mono">{suggestedSlug}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.tables.type')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'product' | 'service')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="product">{t('admin.categories.typeProduct')}</option>
              <option value="service">{t('admin.categories.typeService')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 w-full cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown"
              />
              {t('admin.tables.active')}
            </label>
          </div>
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
            disabled={!name.trim() || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'create' ? t('admin.categories.create') : t('admin.categories.save')}
          </button>
        </div>
      </form>
    </>
  );
}

export function AdminCategoryModal({
  open,
  mode,
  initial,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: AdminCategoryModalProps) {
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
      <div className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <CategoryForm
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
