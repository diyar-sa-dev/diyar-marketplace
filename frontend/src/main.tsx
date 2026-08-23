import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AdminAuthProvider } from './admin/auth/AdminAuthContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationProvider.tsx';
import { ChatProvider } from './context/ChatProvider.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';
import { AboutModalProvider } from './context/AboutModalContext.tsx';
import { LocaleProvider } from './lib/i18n/LocaleProvider.tsx';
import { PlatformThemeProvider } from './components/theme/PlatformThemeProvider.tsx';
import { applyDocumentLocale, readStoredLocale } from './lib/i18n/storage.ts';
import { queryClient } from './lib/queryClient.ts';
import './index.css';
import 'sweetalert2/dist/sweetalert2.min.css';

applyDocumentLocale(readStoredLocale());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <PlatformThemeProvider>
          <AboutModalProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <ToastProvider>
                <AuthProvider>
                  <AdminAuthProvider>
                    <NotificationProvider>
                      <ChatProvider>
                        <App />
                      </ChatProvider>
                    </NotificationProvider>
                  </AdminAuthProvider>
                </AuthProvider>
              </ToastProvider>
            </ErrorBoundary>
          </BrowserRouter>
        </AboutModalProvider>
        </PlatformThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
