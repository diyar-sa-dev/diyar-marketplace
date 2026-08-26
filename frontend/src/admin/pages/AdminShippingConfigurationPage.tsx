import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { adminApi } from '../../api/client.ts';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { confirmDeleteCategory } from '../../lib/confirmDialog.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

type Tab = 'carriers' | 'zones' | 'methods' | 'rules';

type Carrier = { id: string; code: string; name: string; is_active?: boolean; sort_order?: number };
type Zone = {
  id: string;
  carrier_id: string;
  name: string;
  country_code?: string | null;
  region?: string | null;
  city?: string | null;
  postal_prefix?: string | null;
  priority?: number;
  is_active?: boolean;
};
type Method = { id: string; carrier_id: string; code: string; name: string; is_active?: boolean };
type RateRule = {
  id: string;
  shipping_method_id: string;
  zone_id?: string | null;
  rate: string;
  min_weight_kg?: string;
  max_weight_kg?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

async function fetchCarriers() {
  const response = await adminApi.get<ApiSuccessResponse<{ carriers: Carrier[] }>>('/admin/shipping/carriers');
  return response.data.data.carriers;
}

async function fetchZones(carrierId: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ zones: Zone[] }>>('/admin/shipping/zones', {
    params: carrierId ? { carrier_id: carrierId } : undefined,
  });
  return response.data.data.zones;
}

async function fetchMethods(carrierId: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ methods: Method[] }>>('/admin/shipping/methods', {
    params: carrierId ? { carrier_id: carrierId } : undefined,
  });
  return response.data.data.methods;
}

async function fetchRateRules(methodId: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ rate_rules: RateRule[] }>>('/admin/shipping/rate-rules', {
    params: methodId ? { shipping_method_id: methodId } : undefined,
  });
  return response.data.data.rate_rules;
}

export default function AdminShippingConfigurationPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('carriers');
  const [search, setSearch] = useState('');
  const [selectedCarrierId, setSelectedCarrierId] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');

  const [carrierForm, setCarrierForm] = useState({ name: '', code: '' });
  const [zoneForm, setZoneForm] = useState({ name: '', city: '', region: '', postal_prefix: '', priority: '0' });
  const [methodForm, setMethodForm] = useState({ code: '', name: '' });
  const [ruleForm, setRuleForm] = useState({ rate: '', min_weight_kg: '0', max_weight_kg: '10', sort_order: '0' });

  const carriersQuery = useQuery({
    queryKey: ['admin', 'shipping', 'carriers'],
    queryFn: fetchCarriers,
    staleTime: 30_000,
  });

  const zonesQuery = useQuery({
    queryKey: ['admin', 'shipping', 'zones', selectedCarrierId],
    queryFn: () => fetchZones(selectedCarrierId),
    enabled: tab === 'zones' || tab === 'rules',
    staleTime: 30_000,
  });

  const methodsQuery = useQuery({
    queryKey: ['admin', 'shipping', 'methods', selectedCarrierId],
    queryFn: () => fetchMethods(selectedCarrierId),
    enabled: tab === 'methods' || tab === 'rules',
    staleTime: 30_000,
  });

  const rulesQuery = useQuery({
    queryKey: ['admin', 'shipping', 'rate-rules', selectedMethodId],
    queryFn: () => fetchRateRules(selectedMethodId),
    enabled: tab === 'rules' && selectedMethodId !== '',
    staleTime: 30_000,
  });

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'shipping'] });
  };

  const createCarrier = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/shipping/carriers', {
        name: carrierForm.name.trim(),
        code: carrierForm.code.trim(),
        is_active: true,
      });
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.created'));
      setCarrierForm({ name: '', code: '' });
      await invalidateAll();
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const createZone = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/shipping/zones', {
        carrier_id: selectedCarrierId,
        name: zoneForm.name.trim(),
        city: zoneForm.city.trim() || null,
        region: zoneForm.region.trim() || null,
        postal_prefix: zoneForm.postal_prefix.trim() || null,
        priority: Number(zoneForm.priority) || 0,
        is_active: true,
      });
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.created'));
      setZoneForm({ name: '', city: '', region: '', postal_prefix: '', priority: '0' });
      await invalidateAll();
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const createMethod = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/shipping/methods', {
        carrier_id: selectedCarrierId,
        code: methodForm.code.trim(),
        name: methodForm.name.trim(),
        is_active: true,
      });
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.created'));
      setMethodForm({ code: '', name: '' });
      await invalidateAll();
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const createRule = useMutation({
    mutationFn: async () => {
      await adminApi.post('/admin/shipping/rate-rules', {
        shipping_method_id: selectedMethodId,
        zone_id: zonesQuery.data?.[0]?.id ?? null,
        min_weight_kg: ruleForm.min_weight_kg,
        max_weight_kg: ruleForm.max_weight_kg,
        rate: ruleForm.rate,
        sort_order: Number(ruleForm.sort_order) || 0,
        is_active: true,
      });
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.created'));
      setRuleForm({ rate: '', min_weight_kg: '0', max_weight_kg: '10', sort_order: '0' });
      await invalidateAll();
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ kind, id }: { kind: Tab; id: string }) => {
      const paths: Record<Tab, string> = {
        carriers: `/admin/shipping/carriers/${id}`,
        zones: `/admin/shipping/zones/${id}`,
        methods: `/admin/shipping/methods/${id}`,
        rules: `/admin/shipping/rate-rules/${id}`,
      };
      await adminApi.delete(paths[kind]);
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.deleted'));
      await invalidateAll();
    },
    onError: () => toast.error(t('admin.shipping.createError')),
  });

  const carriers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (carriersQuery.data ?? []).filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [carriersQuery.data, search]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'carriers', label: t('admin.shipping.tabs.carriers') },
    { id: 'zones', label: t('admin.shipping.tabs.zones') },
    { id: 'methods', label: t('admin.shipping.tabs.methods') },
    { id: 'rules', label: t('admin.shipping.tabs.rules') },
  ];

  const isLoading =
    carriersQuery.isLoading ||
    (tab === 'zones' && zonesQuery.isLoading) ||
    (tab === 'methods' && methodsQuery.isLoading) ||
    (tab === 'rules' && rulesQuery.isLoading);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${
              tab === item.id ? 'bg-diyar-dark text-white' : 'bg-white text-diyar-dark border border-gray-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(tab === 'zones' || tab === 'methods' || tab === 'rules') && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-semibold text-diyar-dark">{t('admin.shipping.selectCarrier')}</label>
          <select
            className="w-full max-w-md rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={selectedCarrierId}
            onChange={(event) => {
              setSelectedCarrierId(event.target.value);
              setSelectedMethodId('');
            }}
          >
            <option value="">{t('admin.shipping.chooseCarrier')}</option>
            {(carriersQuery.data ?? []).map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {carrier.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'rules' && selectedCarrierId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-semibold text-diyar-dark">{t('admin.shipping.selectMethod')}</label>
          <select
            className="w-full max-w-md rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={selectedMethodId}
            onChange={(event) => setSelectedMethodId(event.target.value)}
          >
            <option value="">{t('admin.shipping.chooseMethod')}</option>
            {(methodsQuery.data ?? []).map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <AdminResourceTable
        title={t('admin.shipping.title')}
        subtitle={t('admin.shipping.subtitle')}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('admin.tables.searchCategories')}
        isLoading={isLoading}
        isError={carriersQuery.isError}
        isEmpty={!isLoading && tab === 'carriers' && carriers.length === 0}
        emptyTitle={t('admin.shipping.empty')}
        actions={
          <PermissionGate permission="shipping.manage">
            {tab === 'carriers' && (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!carrierForm.name.trim() || !carrierForm.code.trim()) return;
                  createCarrier.mutate();
                }}
              >
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.carrierName')} value={carrierForm.name} onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })} />
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.carrierCode')} value={carrierForm.code} onChange={(e) => setCarrierForm({ ...carrierForm, code: e.target.value })} />
                <button type="submit" disabled={createCarrier.isPending} className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white">
                  <Plus size={16} />{t('admin.shipping.addCarrier')}
                </button>
              </form>
            )}
            {tab === 'zones' && selectedCarrierId && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!zoneForm.name.trim()) return; createZone.mutate(); }}>
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.zoneName')} value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} />
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.zoneCity')} value={zoneForm.city} onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })} />
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.zoneRegion')} value={zoneForm.region} onChange={(e) => setZoneForm({ ...zoneForm, region: e.target.value })} />
                <button type="submit" disabled={createZone.isPending} className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} />{t('admin.shipping.addZone')}</button>
              </form>
            )}
            {tab === 'methods' && selectedCarrierId && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!methodForm.code.trim() || !methodForm.name.trim()) return; createMethod.mutate(); }}>
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.methodCode')} value={methodForm.code} onChange={(e) => setMethodForm({ ...methodForm, code: e.target.value })} />
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.methodName')} value={methodForm.name} onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })} />
                <button type="submit" disabled={createMethod.isPending} className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} />{t('admin.shipping.addMethod')}</button>
              </form>
            )}
            {tab === 'rules' && selectedMethodId && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!ruleForm.rate.trim()) return; createRule.mutate(); }}>
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.ruleRate')} value={ruleForm.rate} onChange={(e) => setRuleForm({ ...ruleForm, rate: e.target.value })} />
                <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin.shipping.ruleMaxWeight')} value={ruleForm.max_weight_kg} onChange={(e) => setRuleForm({ ...ruleForm, max_weight_kg: e.target.value })} />
                <button type="submit" disabled={createRule.isPending} className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} />{t('admin.shipping.addRule')}</button>
              </form>
            )}
          </PermissionGate>
        }
        columns={
          <tr>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t('admin.shipping.colName')}</th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t('admin.shipping.colDetails')}</th>
            <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">{t('admin.tables.status')}</th>
            <th className="px-4 py-3" />
          </tr>
        }
      >
        {tab === 'carriers' &&
          carriers.map((carrier) => (
            <tr key={carrier.id} className="hover:bg-[#f7f4f1]/50">
              <td className="px-4 py-3 font-semibold text-diyar-dark">{carrier.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">{carrier.code}</td>
              <td className="px-4 py-3"><AdminStatusBadge status={carrier.is_active ? 'active' : 'inactive'} /></td>
              <td className="px-4 py-3 text-end">
                <PermissionGate permission="shipping.manage">
                  <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={async () => { if (await confirmDeleteCategory(t)) deleteMutation.mutate({ kind: 'carriers', id: carrier.id }); }}>
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        {tab === 'zones' &&
          (zonesQuery.data ?? []).map((zone) => (
            <tr key={zone.id} className="hover:bg-[#f7f4f1]/50">
              <td className="px-4 py-3 font-semibold text-diyar-dark">{zone.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{[zone.city, zone.region, zone.postal_prefix].filter(Boolean).join(' · ') || '—'}</td>
              <td className="px-4 py-3"><AdminStatusBadge status={zone.is_active ? 'active' : 'inactive'} /></td>
              <td className="px-4 py-3 text-end">
                <PermissionGate permission="shipping.manage">
                  <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={async () => { if (await confirmDeleteCategory(t)) deleteMutation.mutate({ kind: 'zones', id: zone.id }); }}>
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
              </td>
            </tr>
          ))}
        {tab === 'methods' &&
          (methodsQuery.data ?? []).map((method) => (
            <tr key={method.id} className="hover:bg-[#f7f4f1]/50">
              <td className="px-4 py-3 font-semibold text-diyar-dark">{method.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">{method.code}</td>
              <td className="px-4 py-3"><AdminStatusBadge status={method.is_active ? 'active' : 'inactive'} /></td>
              <td className="px-4 py-3" />
            </tr>
          ))}
        {tab === 'rules' &&
          (rulesQuery.data ?? []).map((rule) => (
            <tr key={rule.id} className="hover:bg-[#f7f4f1]/50">
              <td className="px-4 py-3 font-semibold text-diyar-dark">{rule.rate} SAR</td>
              <td className="px-4 py-3 text-sm text-gray-600">{rule.min_weight_kg}–{rule.max_weight_kg ?? '∞'} kg</td>
              <td className="px-4 py-3"><AdminStatusBadge status={rule.is_active ? 'active' : 'inactive'} /></td>
              <td className="px-4 py-3 text-end">
                <PermissionGate permission="shipping.manage">
                  <button type="button" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={async () => { if (await confirmDeleteCategory(t)) deleteMutation.mutate({ kind: 'rules', id: rule.id }); }}>
                    <Trash2 size={16} />
                  </button>
                </PermissionGate>
              </td>
            </tr>
          ))}
      </AdminResourceTable>
    </div>
  );
}
