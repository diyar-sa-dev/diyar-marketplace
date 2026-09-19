import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import LandingApp from './landing/LandingApp.tsx';
import { applyLandingSeo } from './landing/landingSeo.ts';
import { COMING_SOON_COPY } from './landing/comingSoon/copy.ts';
import { ensureLandingFonts } from './landing/landingFonts.ts';
import './index.css';

document.documentElement.lang = 'ar';
document.documentElement.dir = 'rtl';
void ensureLandingFonts('ar');
applyLandingSeo({ meta: COMING_SOON_COPY.meta }, 'ar');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LandingApp />
    </BrowserRouter>
  </StrictMode>,
);
