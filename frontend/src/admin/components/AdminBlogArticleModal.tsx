import { useMemo, useRef, useState } from 'react';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { uploadCmsImage } from '../../api/adminCms.ts';
import { AdminBlogTagPicker } from './AdminBlogTagPicker.tsx';
import { AdminCmsImageField } from './AdminCmsImageField.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { BlogCategory, BlogTag } from '../../types/blog.ts';

export type BlogArticleFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blog_category_id: string;
  new_category_name?: string;
  tag_ids: string[];
  new_tag_names?: string[];
  author_name: string;
  author_role: string;
  hero_image: string;
  author_avatar: string;
  seo_title: string;
  seo_description: string;
};

type AdminBlogArticleModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: BlogArticleFormValues;
  categories: BlogCategory[];
  tags: BlogTag[];
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

type BlogArticleFormProps = {
  mode: 'create' | 'edit';
  initial?: BlogArticleFormValues;
  categories: BlogCategory[];
  tags: BlogTag[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: BlogArticleFormValues) => void;
};

function RequiredFieldLabel({ label }: { label: string }) {
  return (
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
      {label} <span className="text-red-500">*</span>
    </span>
  );
}

function BlogArticleForm({
  mode,
  initial,
  categories,
  tags,
  isSaving,
  onClose,
  onSubmit,
}: BlogArticleFormProps) {
  const { t, dir } = useLocale();

  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [blogCategoryId, setBlogCategoryId] = useState(initial?.blog_category_id ?? '');
  const [categoryMode, setCategoryMode] = useState<'existing' | 'custom'>(() => {
    if (initial?.blog_category_id) return 'existing';
    return categories.length === 0 ? 'custom' : 'existing';
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [tagIds, setTagIds] = useState<string[]>(initial?.tag_ids ?? []);
  const [newTagNames, setNewTagNames] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState(
    initial?.author_name ?? (mode === 'create' ? t('admin.blogArticles.defaultAuthor') : ''),
  );
  const [authorRole, setAuthorRole] = useState(initial?.author_role ?? '');
  const [heroImage, setHeroImage] = useState(initial?.hero_image ?? '');
  const [authorAvatar, setAuthorAvatar] = useState(initial?.author_avatar ?? '');
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const suggestedSlug = useMemo(() => slugifyName(title), [title]);
  const displaySlug = slugTouched ? slug : mode === 'edit' ? slug : suggestedSlug;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      slug: displaySlug.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      blog_category_id: categoryMode === 'existing' ? blogCategoryId : '',
      new_category_name: categoryMode === 'custom' ? newCategoryName.trim() : undefined,
      tag_ids: tagIds,
      new_tag_names: newTagNames.length > 0 ? newTagNames : undefined,
      author_name: authorName.trim(),
      author_role: authorRole.trim(),
      hero_image: heroImage.trim(),
      author_avatar: authorAvatar.trim(),
      seo_title: seoTitle.trim(),
      seo_description: seoDescription.trim(),
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
          <p className="mt-1 text-sm text-gray-500">{t('admin.blogArticles.slugHint')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="blog-article-modal" dir={dir}>
        <div>
          <RequiredFieldLabel label={t('admin.tables.title')} />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('admin.blogArticles.placeholders.title')}
            data-testid="blog-article-title"
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
            placeholder={suggestedSlug || t('admin.blogArticles.placeholders.slug')}
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
            placeholder={t('admin.blogArticles.placeholders.excerpt')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir={dir}
          />
        </div>

        <div>
          <RequiredFieldLabel label={t('admin.blogArticles.content')} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            placeholder={t('admin.blogArticles.placeholders.content')}
            data-testid="blog-article-content"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm outline-none focus:border-diyar-brown"
            dir="ltr"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.category')}
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryMode('existing')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                categoryMode === 'existing'
                  ? 'bg-diyar-dark text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-diyar-brown'
              }`}
            >
              {t('admin.blogArticles.useExistingCategory')}
            </button>
            <button
              type="button"
              onClick={() => setCategoryMode('custom')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                categoryMode === 'custom'
                  ? 'bg-diyar-dark text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-diyar-brown'
              }`}
            >
              {t('admin.blogArticles.createCategory')}
            </button>
          </div>
          {categoryMode === 'existing' ? (
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
          ) : (
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t('admin.blogArticles.placeholders.categoryName')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir={dir}
            />
          )}
        </div>

        <AdminBlogTagPicker
          tags={tags}
          selectedIds={tagIds}
          pendingNames={newTagNames}
          onSelectedIdsChange={setTagIds}
          onPendingNamesChange={setNewTagNames}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <RequiredFieldLabel label={t('admin.blogArticles.authorName')} />
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              placeholder={t('admin.blogArticles.defaultAuthor')}
              data-testid="blog-article-author"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir={dir}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              {t('admin.blogArticles.authorRole')}
            </label>
            <input
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              placeholder={t('admin.blogArticles.placeholders.authorRole')}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
              dir={dir}
            />
          </div>
        </div>

        <AdminCmsImageField
          label={t('admin.blogArticles.heroImage')}
          value={heroImage}
          onChange={setHeroImage}
          context="blog_hero"
          uploading={uploadingHero}
          onUploadingChange={setUploadingHero}
        />

        <AdminCmsImageField
          label={t('admin.blogArticles.authorAvatar')}
          value={authorAvatar}
          onChange={setAuthorAvatar}
          context="blog_avatar"
          uploading={uploadingAvatar}
          onUploadingChange={setUploadingAvatar}
        />

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.blogArticles.seoTitle')}
          </label>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={t('admin.blogArticles.placeholders.seoTitle')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir={dir}
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
            placeholder={t('admin.blogArticles.placeholders.seoDescription')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
            dir={dir}
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
  isSaving,
  onClose,
  onSubmit,
}: AdminBlogArticleModalProps) {
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
        <BlogArticleForm
          key={formKey}
          mode={mode}
          initial={initial}
          categories={categories}
          tags={tags}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
