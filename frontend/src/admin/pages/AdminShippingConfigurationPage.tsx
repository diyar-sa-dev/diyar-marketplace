import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminApi } from '../../api/client.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type Carrier = {
  id: string;
  code: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
};

async function fetchCarriers() {
  const response = await adminApi.get<
    ApiSuccessResponse<{ carriers: Carrier[]; meta: { total: number } }>
  >('/admin/shipping/carriers');
  return response.data.data;
}

export default function AdminShippingConfigurationPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const query = useQuery({ queryKey: ['admin', 'shipping', 'carriers'], queryFn: fetchCarriers });

  const createMutation = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/shipping/carriers', {
        name: name.trim(),
        code: code.trim(),
        is_active: true,
      });
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.created'));
      setName('');
      setCode('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'shipping'] });
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const carriers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (query.data?.carriers ?? []).filter((carrier) => {
      if (!q) return true;
      return carrier.name.toLowerCase().includes(q) || carrier.code.toLowerCase().includes(q);
    });
  }, [query.data?.carriers, search]);

  return (
    <AdminResourceTable
      title={t('admin.shipping.title')}
      subtitle={t('admin.shipping.subtitle')}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('admin.tables.searchCategories')}
      isLoading={query.isLoading}
      isError={query.isError}
      isEmpty={!query.isLoading && !query.isError && carriers.length === 0}
      emptyTitle={t('admin.shipping.empty')}
      actions={
        <PermissionGate permission="shipping.manage">
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim() || !code.trim()) return;
              createMutation.mutate();
            }}
          >
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder={t('admin.shipping.carrierName')}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder={t('admin.shipping.carrierCode')}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white"
            >
              <Plus size={16} />
              {t('admin.shipping.addCarrier')}
            </button>
          </form>
        </PermissionGate>
      }
      columns={
        <tr>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.carrierName')}
          </th>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.carrierCode')}
          </th>
          <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.tables.status')}
          </th>
        </tr>
      }
    >
      {carriers.map((carrier) => (
        <tr key={carrier.id} className="hover:bg-[#f7f4f1]/50">
          <td className="px-4 py-3 font-semibold text-diyar-dark">{carrier.name}</td>
          <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">
            {carrier.code}
          </td>
          <td className="px-4 py-3">
            <AdminStatusBadge status={carrier.is_active ? 'active' : 'inactive'} />
          </td>
        </tr>
      ))}
    </AdminResourceTable>
  );
}
