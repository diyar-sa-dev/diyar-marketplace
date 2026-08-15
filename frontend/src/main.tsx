import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';
import { queryClient } from './lib/queryClient.ts';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <CartProvider>
              <App />
            </CartProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
