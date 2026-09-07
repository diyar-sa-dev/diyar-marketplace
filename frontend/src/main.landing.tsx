import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandingApp from './landing/LandingApp.tsx';
import {
  LandingLocaleProvider,
  resolveLandingLocaleFromParam,
} from './landing/LandingLocaleProvider.tsx';
import { DEFAULT_LANDING_LOCALE, isLandingLocale } from './landing/i18n/types.ts';
import { applyLandingSeo } from './landing/landingSeo.ts';
import { getLandingCatalog } from './landing/i18n/catalogs/index.ts';
import { ensureLandingFonts } from './landing/landingFonts.ts';
import './index.css';

function bootLandingLocale() {
  const segment = window.location.pathname.replace(/^\//, '').split('/')[0];
  if (segment && isLandingLocale(segment)) {
    return segment;
  }
  const stored = window.localStorage.getItem('diyar-landing-locale');
  if (stored && isLandingLocale(stored)) {
    return stored;
  }
  return DEFAULT_LANDING_LOCALE;
}

const bootLocale = bootLandingLocale();
document.documentElement.lang = bootLocale;
document.documentElement.dir = bootLocale === 'ar' ? 'rtl' : 'ltr';
void ensureLandingFonts(bootLocale);
applyLandingSeo(getLandingCatalog(bootLocale), bootLocale);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LandingLocaleProvider initialLocale={bootLocale}>
      <BrowserRouter>
        <LandingApp />
      </BrowserRouter>
    </LandingLocaleProvider>
  </StrictMode>,
);
