import '@testing-library/jest-dom/vitest';
import { beforeAll } from 'vitest';
import { preloadLocaleCatalogs } from '../lib/i18n/localeCatalog.ts';

beforeAll(async () => {
  await preloadLocaleCatalogs(['ar', 'en']);
});
