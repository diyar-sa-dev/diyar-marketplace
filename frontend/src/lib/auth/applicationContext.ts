export type ApplicationContext = 'marketplace' | 'admin';

export function resolveApplicationContext(pathname: string): ApplicationContext {
  return pathname.startsWith('/admin') ? 'admin' : 'marketplace';
}

export function resolveApiContextFromUrl(url: string | undefined): ApplicationContext {
  if (!url) {
    return 'marketplace';
  }

  const normalized = url.startsWith('/') ? url : `/${url}`;

  return normalized.includes('/admin/') || normalized === '/admin' ? 'admin' : 'marketplace';
}
