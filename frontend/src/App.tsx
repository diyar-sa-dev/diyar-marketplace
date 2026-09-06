/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { lazyWithRetry } from './lib/lazyWithRetry.ts';
import { AdminAuthProvider } from './admin/auth/AdminAuthContext.tsx';
import { AdminPageSkeleton } from './admin/components/AdminPageSkeleton.tsx';

const AdminShell = lazyWithRetry(() => import('./admin/AdminShell.tsx'), 'admin-shell');
const MarketplaceShell = lazyWithRetry(() => import('./MarketplaceShell.tsx'), 'marketplace-shell');

function MarketplaceBootFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-diyar-brown/30 border-t-diyar-brown rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <AdminAuthProvider>
        <Suspense fallback={<AdminPageSkeleton />}>
          <AdminShell />
        </Suspense>
      </AdminAuthProvider>
    );
  }

  return (
    <Suspense fallback={<MarketplaceBootFallback />}>
      <MarketplaceShell />
    </Suspense>
  );
}
