import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import '@fontsource/alexandria/400.css';
import '@fontsource/alexandria/700.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';
import { AboutModalProvider } from './context/AboutModalContext.tsx';
import { LocaleProvider } from './lib/i18n/LocaleProvider.tsx';
import { PlatformThemeProvider } from './components/theme/PlatformThemeProvider.tsx';
import { MarketplaceMessagingProviders } from './components/providers/MarketplaceMessagingProviders.tsx';
import { applyDocumentLocale, readStoredLocale } from './lib/i18n/storage.ts';
import { applyPageSeo, DEFAULT_SEO } from './lib/seo/pageSeo.ts';
import { queryClient } from './lib/queryClient.ts';
import { registerDeployRecovery, clearDeployRecoveryFlag } from './lib/deployRecovery.ts';
import './index.css';

applyDocumentLocale(readStoredLocale());
registerDeployRecovery();
clearDeployRecoveryFlag();
applyPageSeo({
  title: DEFAULT_SEO.title,
  description: DEFAULT_SEO.description,
  image: DEFAULT_SEO.image,
  canonicalPath: window.location.pathname === '/' ? '/' : undefined,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AboutModalProvider>
          <BrowserRouter>
            <ToastProvider>
              <AuthProvider>
                <ErrorBoundary>
                  <MarketplaceMessagingProviders>
                    <PlatformThemeProvider>
                      <App />
                    </PlatformThemeProvider>
                  </MarketplaceMessagingProviders>
                </ErrorBoundary>
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </AboutModalProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
