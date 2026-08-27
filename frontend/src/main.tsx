import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';
import { AboutModalProvider } from './context/AboutModalContext.tsx';
import { LocaleProvider } from './lib/i18n/LocaleProvider.tsx';
import { PlatformThemeProvider } from './components/theme/PlatformThemeProvider.tsx';
import { MarketplaceMessagingProviders } from './components/providers/MarketplaceMessagingProviders.tsx';
import { applyDocumentLocale, readStoredLocale } from './lib/i18n/storage.ts';
import { ensureLocaleCatalog } from './lib/i18n/localeCatalog.ts';
import { queryClient } from './lib/queryClient.ts';
import './index.css';

applyDocumentLocale(readStoredLocale());

void ensureLocaleCatalog(readStoredLocale()).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AboutModalProvider>
            <BrowserRouter>
              <ErrorBoundary>
                <ToastProvider>
                  <AuthProvider>
                    <MarketplaceMessagingProviders>
                      <PlatformThemeProvider>
                        <App />
                      </PlatformThemeProvider>
                    </MarketplaceMessagingProviders>
                  </AuthProvider>
                </ToastProvider>
              </ErrorBoundary>
            </BrowserRouter>
          </AboutModalProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
});
