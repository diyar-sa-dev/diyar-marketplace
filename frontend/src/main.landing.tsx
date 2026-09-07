import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandingApp from './landing/LandingApp.tsx';
import { LandingLocaleProvider } from './landing/LandingLocaleProvider.tsx';
import { resolveLandingLocaleFromPath } from './landing/constants.ts';
import { landingLocaleDirection } from './landing/i18n/types.ts';
import { applyLandingSeo } from './landing/landingSeo.ts';
import { getLandingCatalog } from './landing/i18n/catalogs/index.ts';
import { ensureLandingFonts } from './landing/landingFonts.ts';
import './index.css';

const bootLocale = resolveLandingLocaleFromPath(window.location.pathname);
document.documentElement.lang = bootLocale;
document.documentElement.dir = landingLocaleDirection(bootLocale);
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
