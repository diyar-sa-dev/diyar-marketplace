import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import type { BlogTag } from '../../types/blog.ts';

type AdminBlogTagPickerProps = {
  tags: BlogTag[];
  selectedIds: string[];
  pendingNames: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onPendingNamesChange: (names: string[]) => void;
};

export function AdminBlogTagPicker({
  tags,
  selectedIds,
  pendingNames,
  onSelectedIdsChange,
  onPendingNamesChange,
}: AdminBlogTagPickerProps) {
  const { t, dir } = useLocale();
  const [draftName, setDraftName] = useState('');

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedIds.includes(tag.id)),
    [tags, selectedIds],
  );

  const availableTags = useMemo(
    () => tags.filter((tag) => !selectedIds.includes(tag.id)),
    [tags, selectedIds],
  );

  const addDraftTag = () => {
    const name = draftName.trim();
    if (!name) return;

    const exists =
      pendingNames.some((entry) => entry.toLowerCase() === name.toLowerCase()) ||
      tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase());

    if (exists) {
      const existing = tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
      if (existing && !selectedIds.includes(existing.id)) {
        onSelectedIdsChange([...selectedIds, existing.id]);
      }
      setDraftName('');
      return;
    }

    onPendingNamesChange([...pendingNames, name]);
    setDraftName('');
  };

  return (
    <div dir={dir}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {t('admin.blogArticles.tags')}
      </label>

      {(selectedTags.length > 0 || pendingNames.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectedIdsChange(selectedIds.filter((id) => id !== tag.id))}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-diyar-dark px-3 py-1.5 text-xs font-semibold text-white"
            >
              {tag.name}
              <X size={12} />
            </button>
          ))}
          {pendingNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onPendingNamesChange(pendingNames.filter((entry) => entry !== name))}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-diyar-brown bg-diyar-brown/5 px-3 py-1.5 text-xs font-semibold text-diyar-brown"
            >
              {name}
              <span className="text-[10px] opacity-70">{t('admin.blogArticles.newTag')}</span>
              <X size={12} />
            </button>
          ))}
        </div>
      )}

      {availableTags.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-[#f7f4f1]/40 p-3">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelectedIdsChange([...selectedIds, tag.id])}
              className="cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-diyar-brown hover:text-diyar-brown"
            >
              {tag.name}
            </button>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <p className="mb-3 text-xs text-gray-500">{t('admin.blogArticles.noTags')}</p>
      ) : null}

      <div className="flex gap-2">
        <input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addDraftTag();
            }
          }}
          placeholder={t('admin.blogArticles.placeholders.tagName')}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-diyar-brown"
          dir={dir}
        />
        <button
          type="button"
          onClick={addDraftTag}
          disabled={!draftName.trim()}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:border-diyar-brown disabled:opacity-50"
        >
          <Plus size={14} />
          {t('admin.blogArticles.addTag')}
        </button>
      </div>
    </div>
  );
}
