import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';
import { LocaleProvider } from './lib/i18n/LocaleProvider.tsx';
import { applyDocumentLocale, readStoredLocale } from './lib/i18n/storage.ts';
import { queryClient } from './lib/queryClient.ts';
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

applyDocumentLocale(readStoredLocale());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ErrorBoundary>
          <ToastProvider>
            <BrowserRouter>
              <AuthProvider>
                <App />
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </ErrorBoundary>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
