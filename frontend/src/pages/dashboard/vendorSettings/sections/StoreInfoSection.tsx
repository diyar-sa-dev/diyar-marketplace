import { Link } from 'react-router-dom';
import { ExternalLink, Globe } from 'lucide-react';
import { RequiredLabel } from '../../../../components/dashboard/vendor/RequiredLabel.tsx';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import { INPUT_CLASS } from '../vendorSettings.types.ts';
import { sanitizeStoreSlug } from '../vendorSettings.utils.ts';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type StoreInfoSectionProps = Pick<
  VendorSettingsPageState,
  't' | 'storeForm' | 'patchStoreForm' | 'fieldErrors'
>;

export function StoreInfoSection({
  t,
  storeForm,
  patchStoreForm,
  fieldErrors,
}: StoreInfoSectionProps) {
  const { businessName, storeSlug, description, location, websiteUrl } = storeForm;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <RequiredLabel required className="text-sm font-bold text-gray-700">
          {t('vendor.settings.store.storeName')}
        </RequiredLabel>
        <input
          type="text"
          value={businessName}
          onChange={(event) => patchStoreForm({ businessName: event.target.value })}
          placeholder={t('vendor.settings.store.placeholders.storeName')}
          className={INPUT_CLASS}
        />
        <FieldError message={fieldErrors.business_name} />
      </div>

      <div className="space-y-2">
        <RequiredLabel required className="text-sm font-bold text-gray-700">
          {t('vendor.settings.store.slug')}
        </RequiredLabel>
        <div className="relative" dir="ltr">
          <span className="absolute inset-y-0 inset-s-0 flex items-center ps-3 text-xs font-bold text-gray-400 pointer-events-none">
            /store/
          </span>
          <input
            type="text"
            value={storeSlug}
            onChange={(event) =>
              patchStoreForm({ storeSlug: sanitizeStoreSlug(event.target.value) })
            }
            placeholder="my-store-name"
            className={`${INPUT_CLASS} ps-19 font-mono text-sm`}
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            maxLength={80}
          />
        </div>
        <p className="text-xs text-gray-500">{t('vendor.settings.store.slugHint')}</p>
        {storeSlug ? (
          <p className="text-xs text-diyar-brown font-medium" dir="ltr">
            {t('vendor.settings.store.storePathHint', { slug: storeSlug })}
          </p>
        ) : null}
        <FieldError message={fieldErrors.slug} />
      </div>

      <div className="space-y-2 md:col-span-2">
        <RequiredLabel className="text-sm font-bold text-gray-700">
          {t('vendor.settings.store.description')}
        </RequiredLabel>
        <textarea
          rows={4}
          value={description}
          onChange={(event) => patchStoreForm({ description: event.target.value })}
          placeholder={t('vendor.settings.store.placeholders.description')}
          className={INPUT_CLASS}
        />
        <p className="text-xs text-gray-500">{t('vendor.settings.store.descriptionHint')}</p>
        <FieldError message={fieldErrors.description} />
      </div>

      <div className="space-y-2">
        <RequiredLabel className="text-sm font-bold text-gray-700">
          {t('vendor.settings.store.location')}
        </RequiredLabel>
        <input
          type="text"
          value={location}
          onChange={(event) => patchStoreForm({ location: event.target.value })}
          placeholder={t('vendor.settings.store.placeholders.location')}
          className={INPUT_CLASS}
        />
        <FieldError message={fieldErrors.location} />
      </div>

      <div className="space-y-2">
        <RequiredLabel className="text-sm font-bold text-gray-700">
          {t('vendor.settings.store.storeWebsiteUrl')}
        </RequiredLabel>
        <p className="text-xs text-gray-500">{t('vendor.settings.store.externalWebsiteHint')}</p>
        <div className="relative mt-1">
          <Globe
            size={16}
            className="absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none inset-s-3.5"
          />
          <input
            type="url"
            value={websiteUrl}
            onChange={(event) => patchStoreForm({ websiteUrl: event.target.value })}
            placeholder={t('vendor.settings.store.placeholders.websiteUrl')}
            className={`${INPUT_CLASS} dir-ltr text-left ps-10`}
            dir="ltr"
            autoComplete="url"
          />
        </div>
        <FieldError message={fieldErrors.website_url} />
      </div>

      {storeSlug ? (
        <div className="md:col-span-2 rounded-xl border border-diyar-brown/20 bg-amber-50/50 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-diyar-dark mb-1">
              {t('vendor.settings.store.diyarStoreLink')}
            </p>
            <Link
              to={`/store/${storeSlug}`}
              className="text-sm text-diyar-brown hover:underline font-mono truncate block"
              dir="ltr"
            >
              /store/{storeSlug}
            </Link>
          </div>
          <ExternalLink size={16} className="text-diyar-brown shrink-0" />
        </div>
      ) : null}
    </div>
  );
}
