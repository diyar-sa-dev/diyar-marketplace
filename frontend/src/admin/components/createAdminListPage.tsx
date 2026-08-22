import AdminGenericListPage, { type ListPageConfig } from './AdminGenericListPage.tsx';

export function createAdminListPage<T extends Record<string, unknown>>(config: ListPageConfig<T>) {
  return function AdminListPage() {
    return <AdminGenericListPage config={config} />;
  };
}
