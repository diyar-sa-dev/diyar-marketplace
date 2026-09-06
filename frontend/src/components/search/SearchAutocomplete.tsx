import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Search, Store, Tag, Wrench } from 'lucide-react';
import { useCatalogSearchSuggestions } from '../../hooks/catalog/useCatalogSearchSuggestions.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import type { CatalogSearchSuggestion } from '../../api/catalogSearchSuggestions.ts';

type SearchAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showImageSearch?: boolean;
  imageSearchDisabled?: boolean;
  onImageSearchClick?: () => void;
  autoFocus?: boolean;
};

function suggestionIcon(type: CatalogSearchSuggestion['type']) {
  switch (type) {
    case 'vendor':
      return Store;
    case 'category':
      return Tag;
    case 'service':
      return Wrench;
    default:
      return Search;
  }
}

export function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder,
  className = '',
  inputClassName = '',
  showImageSearch = true,
  imageSearchDisabled = true,
  onImageSearchClick,
  autoFocus = false,
}: SearchAutocompleteProps) {
  const { t } = useLocale();
  const navigate = useNavigate();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { data, isFetching } = useCatalogSearchSuggestions(value, isOpen);
  const suggestions = data?.suggestions ?? [];
  const trimmed = value.replace(/\s+/g, ' ').trim();
  const showDropdown = isOpen && trimmed.length >= 2;

  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions.length, trimmed]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const navigateToSuggestion = (suggestion: CatalogSearchSuggestion) => {
    setIsOpen(false);
    navigate(suggestion.href);
  };

  const submitSearch = (query = trimmed) => {
    if (!query) {
      return;
    }

    setIsOpen(false);
    if (onSubmit) {
      onSubmit(query);
      return;
    }

    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitSearch();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        navigateToSuggestion(suggestions[activeIndex]);
        return;
      }
      submitSearch();
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 w-full">
        <button
          type="submit"
          className="text-diyar-dark hover:text-diyar-dark/80 transition shrink-0 cursor-pointer"
          aria-label={t('layout.nav.searchPlaceholder')}
        >
          <Search className="w-5 h-5 shrink-0" />
        </button>

        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-label={placeholder ?? t('layout.nav.searchPlaceholder')}
          aria-expanded={showDropdown}
          {...(showDropdown ? { 'aria-controls': listboxId } : {})}
          aria-autocomplete="list"
          placeholder={placeholder ?? t('layout.nav.searchPlaceholder')}
          className={`bg-transparent border-none outline-none w-full text-diyar-dark placeholder:text-gray-400 text-sm h-7 ${inputClassName}`}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isFetching && (
          <Loader2 className="w-4 h-4 animate-spin text-diyar-brown shrink-0" aria-hidden />
        )}

        {showImageSearch && (
          <button
            type="button"
            disabled={imageSearchDisabled}
            onClick={onImageSearchClick}
            aria-label={
              imageSearchDisabled
                ? t('catalog.search.imageSearchDisabled')
                : t('catalog.search.imageSearch')
            }
            title={
              imageSearchDisabled
                ? t('catalog.search.imageSearchDisabled')
                : t('catalog.search.imageSearch')
            }
            className={`transition shrink-0 ml-1 ${
              imageSearchDisabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-400 hover:text-diyar-dark cursor-pointer'
            }`}
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+0.5rem)] inset-inline-start-0 inset-inline-end-0 z-120 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={activeIndex === -1}
            onMouseEnter={() => setActiveIndex(-1)}
            onClick={() => submitSearch()}
            className={`flex w-full items-center gap-3 px-4 py-3 text-start text-sm transition cursor-pointer ${
              activeIndex === -1 ? 'bg-diyar-cream/60' : 'hover:bg-gray-50'
            }`}
          >
            <Search size={16} className="text-diyar-brown shrink-0" />
            <span className="font-bold text-diyar-dark">
              {t('catalog.search.searchFor', { query: trimmed })}
            </span>
          </button>

          {suggestions.length > 0 && (
            <div className="border-t border-gray-100 py-1">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestionIcon(suggestion.type);

                return (
                  <button
                    key={`${suggestion.type}-${suggestion.id}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => navigateToSuggestion(suggestion)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-start transition cursor-pointer ${
                      activeIndex === index ? 'bg-diyar-cream/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={16} className="text-diyar-brown shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-diyar-dark">{suggestion.label}</p>
                      <p className="truncate text-xs text-gray-500">
                        {suggestion.subtitle ?? t(`catalog.search.suggestionType.${suggestion.type}`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!isFetching && suggestions.length === 0 && (
            <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">
              {t('catalog.search.noSuggestions')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
