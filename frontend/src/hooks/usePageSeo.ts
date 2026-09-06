import { useEffect } from 'react';
import { applyPageSeo, resetPageSeo, type PageSeoOptions } from '../lib/seo/pageSeo.ts';

export function usePageSeo(options: PageSeoOptions | null | undefined) {
  useEffect(() => {
    if (!options) {
      return;
    }

    applyPageSeo(options);

    return () => {
      resetPageSeo();
    };
  }, [options?.title, options?.description, options?.image, options?.canonicalPath, options?.noindex]);
}
