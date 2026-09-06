import { useLayoutEffect, useRef } from 'react';
import { applyPageSeo, type PageSeoOptions } from '../lib/seo/pageSeo.ts';

export function usePageSeo(options: PageSeoOptions | null | undefined) {
  const appliedRef = useRef<string>('');

  useLayoutEffect(() => {
    if (!options) {
      return;
    }

    const signature = [
      options.title,
      options.description,
      options.image,
      options.canonicalPath,
      options.noindex,
    ].join('|');

    if (appliedRef.current === signature) {
      return;
    }

    appliedRef.current = signature;
    applyPageSeo(options);
  }, [options?.title, options?.description, options?.image, options?.canonicalPath, options?.noindex]);
}
