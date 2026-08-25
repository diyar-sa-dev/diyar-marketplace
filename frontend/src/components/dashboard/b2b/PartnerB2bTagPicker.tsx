import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';
import type { B2bTag } from '../../../types/b2b.ts';

export const B2B_MAX_TAGS = 10;

type PartnerB2bTagPickerProps = {
  availableTags: B2bTag[];
  selectedTagIds: string[];
  customTagNames: string[];
  onSelectedTagIdsChange: (ids: string[]) => void;
  onCustomTagNamesChange: (names: string[]) => void;
  disabled?: boolean;
};

export function PartnerB2bTagPicker({
  availableTags,
  selectedTagIds,
  customTagNames,
  onSelectedTagIdsChange,
  onCustomTagNamesChange,
  disabled = false,
}: PartnerB2bTagPickerProps) {
  const { t } = useLocale();
  const [customInput, setCustomInput] = useState('');

  const totalSelected = selectedTagIds.length + customTagNames.length;
  const canAddMore = totalSelected < B2B_MAX_TAGS;

  const selectedPresetTags = useMemo(
    () => availableTags.filter((tag) => selectedTagIds.includes(tag.id)),
    [availableTags, selectedTagIds],
  );

  const toggleTag = (tagId: string) => {
    if (disabled) return;

    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tagId));
      return;
    }

    if (!canAddMore) return;
    onSelectedTagIdsChange([...selectedTagIds, tagId]);
  };

  const addCustomTag = () => {
    const normalized = customInput.trim();
    if (!normalized || disabled || !canAddMore) return;

    const existsInPresets = availableTags.some(
      (tag) => tag.name.toLowerCase() === normalized.toLowerCase(),
    );
    const existsInCustom = customTagNames.some(
      (name) => name.toLowerCase() === normalized.toLowerCase(),
    );

    if (existsInPresets || existsInCustom) {
      setCustomInput('');
      return;
    }

    onCustomTagNamesChange([...customTagNames, normalized]);
    setCustomInput('');
  };

  const removeCustomTag = (name: string) => {
    if (disabled) return;
    onCustomTagNamesChange(customTagNames.filter((item) => item !== name));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const active = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              disabled={disabled || (!active && !canAddMore)}
              onClick={() => toggleTag(tag.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
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

      {(selectedPresetTags.length > 0 || customTagNames.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedPresetTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-lg bg-diyar-cream/30 px-2.5 py-1 text-xs font-bold text-diyar-dark"
            >
              {tag.name}
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleTag(tag.id)}
                className="text-gray-500 hover:text-red-600 cursor-pointer"
                aria-label={t('common.delete')}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {customTagNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-100"
            >
              {name}
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeCustomTag(name)}
                className="text-amber-700 hover:text-red-600 cursor-pointer"
                aria-label={t('common.delete')}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={customInput}
          disabled={disabled || !canAddMore}
          onChange={(event) => setCustomInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustomTag();
            }
          }}
          placeholder={t('b2b.partner.placeholders.customTag')}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-diyar-brown/30 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={disabled || !canAddMore || !customInput.trim()}
          onClick={addCustomTag}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-diyar-brown hover:bg-diyar-cream/20 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          {t('b2b.partner.addTag')}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        {t('b2b.partner.tagsHint', { count: totalSelected, max: B2B_MAX_TAGS })}
      </p>
    </div>
  );
}
