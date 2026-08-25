import { useMemo, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadCmsImage } from '../../api/adminCms.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import { toDatetimeLocalValue } from '../../lib/datetimeLocal.ts';
import type { BlogArticleStatus, BlogCategory, BlogTag } from '../../types/blog.ts';

export type BlogArticleFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blog_category_id: string;
  tag_ids: string[];
  author_name: string;
  author_role: string;
  hero_image: string;
  author_avatar: string;
  reading_time_minutes: number | null;
  published_at: string;
  seo_title: string;
  seo_description: string;
  status: BlogArticleStatus;
};

type AdminBlogArticleModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: BlogArticleFormValues;
  categories: BlogCategory[];
  tags: BlogTag[];
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: BlogArticleFormValues) => void;
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

type BlogArticleFormProps = {
  mode: 'create' | 'edit';
  initial?: BlogArticleFormValues;
  categories: BlogCategory[];
  tags: BlogTag[];
  existingSlugs: string[];
  currentSlug?: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: BlogArticleFormValues) => void;
};

function BlogArticleForm({
  mode,
  initial,
  categories,
  tags,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: BlogArticleFormProps) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [blogCategoryId, setBlogCategoryId] = useState(initial?.blog_category_id ?? '');
  const [tagIds, setTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [authorName, setAuthorName] = useState(initial?.author_name ?? 'فريق ديار');
  const [authorRole, setAuthorRole] = useState(initial?.author_role ?? '');
  const [heroImage, setHeroImage] = useState(initial?.hero_image ?? '');
  const [authorAvatar, setAuthorAvatar] = useState(initial?.author_avatar ?? '');
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<string>(
    initial?.reading_time_minutes != null ? String(initial.reading_time_minutes) : '',
  );
  const [publishedAt, setPublishedAt] = useState(toDatetimeLocalValue(initial?.published_at));
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? '');
  const [status, setStatus] = useState<BlogArticleStatus>(initial?.status ?? 'draft');
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const suggestedSlug = useMemo(() => {
    const base = slugifyName(title);
    return uniqueSlug(base, existingSlugs, mode === 'edit' ? currentSlug : undefined);
  }, [title, existingSlugs, mode, currentSlug]);

  const displaySlug = slugTouched ? slug : suggestedSlug;

  const toggleTag = (tagId: string) => {
    setTagIds((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
    );
  };

  const handleImageUpload = async (
    file: File,
    context: 'blog-hero' | 'blog-author-avatar',
    onSuccess: (url: string) => void,
    setUploading: (value: boolean) => void,
  ) => {
    setUploading(true);
    try {
      const result = await uploadCmsImage(file, context);
      onSuccess(result.url);
    } catch (error) {
      toast.error(parseApiError(error, locale).message || t('admin.blogArticles.uploadError'));
    } finally {
      setUploading(false);
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
      excerpt: excerpt.trim(),
      content: content.trim(),
      blog_category_id: blogCategoryId,
      tag_ids: tagIds,
      author_name: authorName.trim(),
      author_role: authorRole.trim(),
      hero_image: heroImage.trim(),
      author_avatar: authorAvatar.trim(),
      reading_time_minutes: readingTimeMinutes.trim()
        ? Number.parseInt(readingTimeMinutes, 10)
        : null,
      published_at: publishedAt,
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
      status,
    });
  };

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-diyar-dark">
            {mode === 'create'
              ? t('admin.blogArticles.createTitle')
              : t('admin.blogArticles.editTitle')}
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

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="blog-article-modal">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.title')}
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            data-testid="blog-article-title"
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
            data-testid="blog-article-slug"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.excerpt')}
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.content')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            data-testid="blog-article-content"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.category')}
            </label>
            <select
              value={blogCategoryId}
              onChange={(e) => setBlogCategoryId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            >
              <option value="">{t('admin.blogArticles.noCategory')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.tables.status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogArticleStatus)}
              data-testid="blog-article-status"
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
            {t('admin.blogArticles.tags')}
          </label>
          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 p-3">
            {tags.length === 0 ? (
              <p className="text-xs text-gray-500">{t('admin.blogArticles.noTags')}</p>
            ) : (
              tags.map((tag) => (
                <label
                  key={tag.id}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                    className="rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown"
                  />
                  {tag.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.authorName')}
            </label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              data-testid="blog-article-author"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.authorRole')}
            </label>
            <input
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.heroImage')}
          </label>
          <div className="flex gap-2">
            <input
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
            <input
              ref={heroInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImageUpload(file, 'blog-hero', setHeroImage, setUploadingHero);
                }
                event.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={uploadingHero}
              onClick={() => heroInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer"
            >
              {uploadingHero ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {t('admin.blogArticles.upload')}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.authorAvatar')}
          </label>
          <div className="flex gap-2">
            <input
              value={authorAvatar}
              onChange={(e) => setAuthorAvatar(e.target.value)}
              placeholder="https://"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleImageUpload(file, 'blog-author-avatar', setAuthorAvatar, setUploadingAvatar);
                }
                event.target.value = '';
              }}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 cursor-pointer"
            >
              {uploadingAvatar ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {t('admin.blogArticles.upload')}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.readingTime')}
            </label>
            <input
              type="number"
              min={1}
              value={readingTimeMinutes}
              onChange={(e) => setReadingTimeMinutes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.publishedAt')}
            </label>
            <input
              type="datetime-local"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.seoTitle')}
          </label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.seoDescription')}
          </label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
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
            disabled={!title.trim() || !content.trim() || !authorName.trim() || isSaving}
            data-testid="blog-article-submit"
            className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'create' ? t('admin.blogArticles.create') : t('admin.blogArticles.edit')}
          </button>
        </div>
      </form>
    </>
  );
}

export function AdminBlogArticleModal({
  open,
  mode,
  initial,
  categories,
  tags,
  existingSlugs,
  currentSlug,
  isSaving,
  onClose,
  onSubmit,
}: AdminBlogArticleModalProps) {
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
        <BlogArticleForm
          key={formKey}
          mode={mode}
          initial={initial}
          categories={categories}
          tags={tags}
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
