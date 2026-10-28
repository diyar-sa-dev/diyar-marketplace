import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { adminApi } from '../../api/client.ts';
import { AdminInfiniteSelect } from '../components/AdminInfiniteSelect.tsx';
import { AdminResourceTable } from '../components/AdminResourceTable.tsx';
import {
  AdminShippingFormModal,
  type ShippingFormSubmit,
  type ShippingTab,
} from '../components/AdminShippingFormModal.tsx';
import { TableLtrValue } from '../../components/common/TableLtrValue.tsx';
import { AdminStatusBadge } from '../components/AdminStatusBadge.tsx';
import { AdminTablePagination } from '../components/AdminTablePagination.tsx';
import { DetailTabs } from '../components/DetailTabs.tsx';
import { PermissionGate } from '../components/PermissionGate.tsx';
import { useAdminListQuery } from '../hooks/useAdminListQuery.ts';
import { useLocale } from '../../hooks/useLocale.ts';
import { useToast } from '../../hooks/useToast.ts';
import { adminQueryKey } from '../../lib/auth/queryKeys.ts';
import { confirmDeleteShippingItem } from '../../lib/confirmDialog.ts';
import { parseApiError } from '../../utils/errors.ts';
import type { ApiSuccessResponse } from '../../types/api.ts';

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

type ShippingRow = Carrier | Zone | Method | RateRule;

const ACTION_BTN =
  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold cursor-pointer';

async function fetchZoneOptions(carrierId: string) {
  const response = await adminApi.get<ApiSuccessResponse<{ zones: Zone[] }>>(
    '/admin/shipping/zones',
    { params: { carrier_id: carrierId, per_page: 100 } },
  );
  return response.data.data.zones;
}

function isCarrier(row: ShippingRow): row is Carrier {
  return 'code' in row && 'name' in row && !('carrier_id' in row) && !('rate' in row);
}

function isZone(row: ShippingRow): row is Zone {
  return 'carrier_id' in row && 'name' in row && !('code' in row);
}

function isMethod(row: ShippingRow): row is Method {
  return 'carrier_id' in row && 'code' in row && 'name' in row;
}

function isRateRule(row: ShippingRow): row is RateRule {
  return 'rate' in row && 'shipping_method_id' in row;
}

export default function AdminShippingConfigurationPage() {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mainMode, setMainMode] = useState<'v2' | 'v1'>('v2');
  const [tab, setTab] = useState<ShippingTab>('carriers');
  const [selectedCarrierId, setSelectedCarrierId] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRow | null>(null);

  const integrationsQuery = useQuery({
    queryKey: ['admin-shipping-carrier-integrations'],
    queryFn: async () => {
      const response = await adminApi.get<
        ApiSuccessResponse<{
          carrier_configurations: Array<{
            id: string;
            carrier_code: string;
            name: string;
            is_active: boolean;
            is_sandbox: boolean;
            created_at: string;
          }>;
        }>
      >('/admin/shipping/carrier-integrations');
      return response.data.data.carrier_configurations;
    },
    enabled: mainMode === 'v2',
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({
      carrierCode,
      isActive,
      isSandbox,
    }: {
      carrierCode: string;
      isActive: boolean;
      isSandbox: boolean;
    }) => {
      await adminApi.put(`/admin/shipping/carrier-integrations/${carrierCode}`, {
        is_active: isActive,
        is_sandbox: isSandbox,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping-carrier-integrations'] });
      toast.success(
        locale === 'ar' ? 'تم تحديث حالة الناقل الآلي' : 'Carrier integration updated successfully',
      );
    },
    onError: (err) => {
      toast.error(parseApiError(err).message);
    },
  });

  const carriersQuery = useAdminListQuery<Carrier>({
    resourceKey: 'admin-shipping-carriers',
    endpoint: '/admin/shipping/carriers',
    itemsKey: 'carriers',
    enabled: tab === 'carriers',
  });

  const zonesQuery = useAdminListQuery<Zone>({
    resourceKey: 'admin-shipping-zones',
    endpoint: '/admin/shipping/zones',
    itemsKey: 'zones',
    extraParams: selectedCarrierId ? { carrier_id: selectedCarrierId } : undefined,
    enabled: tab === 'zones' && selectedCarrierId !== '',
  });

  const methodsQuery = useAdminListQuery<Method>({
    resourceKey: 'admin-shipping-methods',
    endpoint: '/admin/shipping/methods',
    itemsKey: 'methods',
    extraParams: selectedCarrierId ? { carrier_id: selectedCarrierId } : undefined,
    enabled: tab === 'methods' && selectedCarrierId !== '',
  });

  const rulesQuery = useAdminListQuery<RateRule>({
    resourceKey: 'admin-shipping-rules',
    endpoint: '/admin/shipping/rate-rules',
    itemsKey: 'rate_rules',
    extraParams: selectedMethodId ? { shipping_method_id: selectedMethodId } : undefined,
    enabled: tab === 'rules' && selectedMethodId !== '',
  });

  const zoneOptionsQuery = useQuery({
    queryKey: adminQueryKey('admin-shipping-zone-options', selectedCarrierId),
    queryFn: () => fetchZoneOptions(selectedCarrierId),
    enabled: selectedCarrierId !== '' && tab === 'rules',
    staleTime: 30_000,
  });

  const activeQuery =
    tab === 'carriers'
      ? carriersQuery
      : tab === 'zones'
        ? zonesQuery
        : tab === 'methods'
          ? methodsQuery
          : rulesQuery;

  const items = activeQuery.data?.items ?? [];
  const meta = activeQuery.data?.meta;
  const needsCarrier = tab === 'zones' || tab === 'methods' || tab === 'rules';
  const needsMethod = tab === 'rules';
  const waitingOnFilter =
    (needsCarrier && selectedCarrierId === '') || (needsMethod && selectedMethodId === '');
  const isLoading = !waitingOnFilter && activeQuery.isLoading;
  const isEmpty = !isLoading && !activeQuery.isError && (waitingOnFilter || items.length === 0);

  const emptyTitle = waitingOnFilter
    ? needsMethod && selectedCarrierId !== '' && selectedMethodId === ''
      ? t('admin.shipping.selectMethodHint')
      : t('admin.shipping.selectCarrierHint')
    : tab === 'zones'
      ? t('admin.shipping.emptyZones')
      : tab === 'methods'
        ? t('admin.shipping.emptyMethods')
        : tab === 'rules'
          ? t('admin.shipping.emptyRules')
          : t('admin.shipping.empty');

  const searchPlaceholder =
    tab === 'zones'
      ? t('admin.shipping.searchZones')
      : tab === 'methods'
        ? t('admin.shipping.searchMethods')
        : tab === 'rules'
          ? t('admin.shipping.searchRules')
          : t('admin.shipping.searchCarriers');

  const addLabel =
    tab === 'zones'
      ? t('admin.shipping.addZone')
      : tab === 'methods'
        ? t('admin.shipping.addMethod')
        : tab === 'rules'
          ? t('admin.shipping.addRule')
          : t('admin.shipping.addCarrier');

  const canCreate =
    tab === 'carriers' ||
    ((tab === 'zones' || tab === 'methods') && selectedCarrierId !== '') ||
    (tab === 'rules' && selectedMethodId !== '');

  const invalidateShipping = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-carriers') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-zones') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-methods') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-rules') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-carrier-options') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-method-options') }),
      queryClient.invalidateQueries({ queryKey: adminQueryKey('admin-shipping-zone-options') }),
    ]);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: ShippingFormSubmit) => {
      if (payload.kind === 'carriers') {
        const body = payload.values;
        if (editing && isCarrier(editing)) {
          await adminApi.patch(`/admin/shipping/carriers/${editing.id}`, body);
        } else {
          await adminApi.post('/admin/shipping/carriers', body);
        }
        return;
      }

      if (payload.kind === 'zones') {
        const body = {
          name: payload.values.name,
          city: payload.values.city || null,
          region: payload.values.region || null,
          postal_prefix: payload.values.postal_prefix || null,
          priority: Number(payload.values.priority) || 0,
          is_active: payload.values.is_active,
        };
        if (editing && isZone(editing)) {
          await adminApi.patch(`/admin/shipping/zones/${editing.id}`, body);
        } else {
          await adminApi.post('/admin/shipping/zones', {
            ...body,
            carrier_id: selectedCarrierId,
          });
        }
        return;
      }

      if (payload.kind === 'methods') {
        const body = payload.values;
        if (editing && isMethod(editing)) {
          await adminApi.patch(`/admin/shipping/methods/${editing.id}`, body);
        } else {
          await adminApi.post('/admin/shipping/methods', {
            ...body,
            carrier_id: selectedCarrierId,
          });
        }
        return;
      }

      const body = {
        rate: payload.values.rate,
        min_weight_kg: payload.values.min_weight_kg,
        max_weight_kg: payload.values.max_weight_kg || null,
        sort_order: Number(payload.values.sort_order) || 0,
        zone_id: payload.values.zone_id || null,
        is_active: payload.values.is_active,
      };
      if (editing && isRateRule(editing)) {
        await adminApi.patch(`/admin/shipping/rate-rules/${editing.id}`, body);
      } else {
        await adminApi.post('/admin/shipping/rate-rules', {
          ...body,
          shipping_method_id: selectedMethodId,
        });
      }
    },
    onSuccess: async () => {
      toast.success(editing ? t('admin.shipping.updated') : t('admin.shipping.created'));
      closeModal();
      await invalidateShipping();
    },
    onError: (error) => {
      const message = parseApiError(error, locale).message;
      toast.error(
        message || (editing ? t('admin.shipping.updateError') : t('admin.shipping.createError')),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ kind, id }: { kind: ShippingTab; id: string }) => {
      const paths: Record<ShippingTab, string> = {
        integrations: '',
        carriers: `/admin/shipping/carriers/${id}`,
        zones: `/admin/shipping/zones/${id}`,
        methods: `/admin/shipping/methods/${id}`,
        rules: `/admin/shipping/rate-rules/${id}`,
      };
      await adminApi.delete(paths[kind]);
    },
    onSuccess: async () => {
      toast.success(t('admin.shipping.deleted'));
      await invalidateShipping();
    },
    onError: (error) => {
      const message = parseApiError(error, locale).message;
      toast.error(message || t('admin.shipping.deleteError'));
    },
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: ShippingRow) => {
    setEditing(row);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-diyar-dark">{t('admin.shipping.title')}</h2>
        <p className="mt-1 text-sm text-gray-500">{t('admin.shipping.subtitle')}</p>
      </div>

      {/* 2 Main Top-Level Modes with animated pill */}
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-100/80 p-1.5 shadow-sm max-w-lg">
        <button
          type="button"
          onClick={() => setMainMode('v2')}
          className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-extrabold transition-all duration-200 cursor-pointer ${
            mainMode === 'v2'
              ? 'bg-white text-diyar-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {locale === 'ar' ? 'الربط الآلي السعودي' : 'Saudi Carrier Providers'}
        </button>
        <button
          type="button"
          onClick={() => setMainMode('v1')}
          className={`flex-1 rounded-xl py-2.5 px-4 text-sm font-extrabold transition-all duration-200 cursor-pointer ${
            mainMode === 'v1'
              ? 'bg-white text-diyar-dark shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {locale === 'ar' ? 'الإعداد اليدوي / أسطول المتجر' : 'Manual Shipping Config (V1)'}
        </button>
      </div>

      {mainMode === 'v1' ? (
        <div className="rounded-3xl border border-gray-100 bg-white px-2 shadow-sm sm:px-4 animate-in fade-in duration-200">
          <DetailTabs
            tabs={[
              { id: 'carriers', label: t('admin.shipping.tabs.carriers') },
              { id: 'zones', label: t('admin.shipping.tabs.zones') },
              { id: 'methods', label: t('admin.shipping.tabs.methods') },
              { id: 'rules', label: t('admin.shipping.tabs.rules') },
            ]}
            activeTab={tab}
            onChange={(id) => setTab(id as ShippingTab)}
          />
        </div>
      ) : null}

      {mainMode === 'v2' ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <h3 className="font-bold text-amber-900">
              {locale === 'ar'
                ? 'بوابات الشحن الآلية (Shipping V2 Gateway Engine)'
                : 'Automated Saudi Carrier Gateway Integrations'}
            </h3>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              {locale === 'ar'
                ? 'تتيح هذه البوابات إصدار بوليصات الشحن (AWB) وتتبع الشحنات آلياً مع شركات النقل المعتمدة في المملكة العربية السعودية مع الحفاظ على تسعيرة العميل المستقلة.'
                : 'Manage automated AWB booking and tracking with certified Saudi courier providers.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {(integrationsQuery.data ?? []).map((carrier) => (
              <div
                key={carrier.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-diyar-dark">{carrier.name}</h4>
                      <span className="font-mono text-xs text-gray-500 uppercase">
                        {carrier.carrier_code}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        carrier.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {carrier.is_active
                        ? locale === 'ar'
                          ? 'مفعل'
                          : 'Active'
                        : locale === 'ar'
                          ? 'معطل'
                          : 'Disabled'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {locale === 'ar' ? 'البيئة التشغيلية:' : 'Environment:'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {carrier.is_sandbox
                          ? locale === 'ar'
                            ? 'بيئة تجريبية (Sandbox)'
                            : 'Sandbox'
                          : locale === 'ar'
                            ? 'إنتاج فعلي (Production)'
                            : 'Production'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        {locale === 'ar' ? 'تاريخ التهيأة:' : 'Configured At:'}
                      </span>
                      <span className="font-mono text-gray-700">
                        {new Date(carrier.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-xs font-medium text-gray-500">
                    {locale === 'ar' ? 'تبديل الحالة' : 'Toggle State'}
                  </span>
                  <PermissionGate permission="shipping.manage">
                    <button
                      type="button"
                      onClick={() =>
                        toggleIntegrationMutation.mutate({
                          carrierCode: carrier.carrier_code,
                          isActive: !carrier.is_active,
                          isSandbox: carrier.is_sandbox,
                        })
                      }
                      disabled={toggleIntegrationMutation.isPending}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                        carrier.is_active
                          ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-diyar-dark text-white hover:bg-[#3D261C]'
                      }`}
                    >
                      {carrier.is_active
                        ? locale === 'ar'
                          ? 'تعطيل الناقل'
                          : 'Disable Carrier'
                        : locale === 'ar'
                          ? 'تفعيل الناقل'
                          : 'Enable Carrier'}
                    </button>
                  </PermissionGate>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {mainMode === 'v1' && needsCarrier ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className={`grid gap-4 ${tab === 'rules' ? 'sm:grid-cols-2' : 'max-w-md'}`}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-diyar-dark">
                {t('admin.shipping.selectCarrier')}
              </label>
              <AdminInfiniteSelect<Carrier>
                value={selectedCarrierId}
                onChange={(id) => {
                  setSelectedCarrierId(id);
                  setSelectedMethodId('');
                  zonesQuery.setPage(1);
                  methodsQuery.setPage(1);
                  rulesQuery.setPage(1);
                }}
                placeholder={t('admin.shipping.chooseCarrier')}
                searchPlaceholder={t('admin.shipping.searchCarriers')}
                resourceKey="admin-shipping-carrier-options"
                endpoint="/admin/shipping/carriers"
                itemsKey="carriers"
              />
            </div>
            {tab === 'rules' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-diyar-dark">
                  {t('admin.shipping.selectMethod')}
                </label>
                <AdminInfiniteSelect<Method>
                  value={selectedMethodId}
                  onChange={(id) => {
                    setSelectedMethodId(id);
                    rulesQuery.setPage(1);
                  }}
                  placeholder={t('admin.shipping.chooseMethod')}
                  searchPlaceholder={t('admin.shipping.searchMethods')}
                  resourceKey="admin-shipping-method-options"
                  endpoint="/admin/shipping/methods"
                  itemsKey="methods"
                  extraParams={selectedCarrierId ? { carrier_id: selectedCarrierId } : undefined}
                  disabled={!selectedCarrierId}
                  enabled={selectedCarrierId !== ''}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <AdminShippingFormModal
        open={modalOpen}
        kind={tab}
        mode={editing ? 'edit' : 'create'}
        isSaving={saveMutation.isPending}
        zoneOptions={(zoneOptionsQuery.data ?? []).map((zone) => ({
          id: zone.id,
          name: zone.name,
        }))}
        initialCarrier={
          editing && isCarrier(editing)
            ? {
                name: editing.name,
                code: editing.code,
                is_active: editing.is_active ?? true,
              }
            : undefined
        }
        initialZone={
          editing && isZone(editing)
            ? {
                name: editing.name,
                city: editing.city ?? '',
                region: editing.region ?? '',
                postal_prefix: editing.postal_prefix ?? '',
                priority: String(editing.priority ?? 0),
                is_active: editing.is_active ?? true,
              }
            : undefined
        }
        initialMethod={
          editing && isMethod(editing)
            ? {
                name: editing.name,
                code: editing.code,
                is_active: editing.is_active ?? true,
              }
            : undefined
        }
        initialRule={
          editing && isRateRule(editing)
            ? {
                rate: editing.rate,
                min_weight_kg: editing.min_weight_kg ?? '0',
                max_weight_kg: editing.max_weight_kg ?? '',
                sort_order: String(editing.sort_order ?? 0),
                zone_id: editing.zone_id ?? '',
                is_active: editing.is_active ?? true,
              }
            : undefined
        }
        onClose={closeModal}
        onSubmit={(payload) => saveMutation.mutate(payload)}
      />

      {mainMode === 'v1' ? (
        <AdminResourceTable
          title={
            tab === 'zones'
              ? t('admin.shipping.tabs.zones')
              : tab === 'methods'
                ? t('admin.shipping.tabs.methods')
                : tab === 'rules'
                  ? t('admin.shipping.tabs.rules')
                  : t('admin.shipping.tabs.carriers')
          }
          searchValue={activeQuery.search}
          onSearchChange={activeQuery.setSearch}
          searchPlaceholder={searchPlaceholder}
          actions={
            <PermissionGate permission="shipping.manage">
              <button
                type="button"
                onClick={openCreate}
                disabled={!canCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {addLabel}
              </button>
            </PermissionGate>
          }
          isLoading={isLoading}
          isError={!waitingOnFilter && activeQuery.isError}
          isEmpty={isEmpty}
          emptyTitle={emptyTitle}
          columns={
            <tr>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.shipping.colName')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.shipping.colDetails')}
              </th>
              <th className="px-4 py-3 text-start text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.status')}
              </th>
              <th className="px-4 py-3 text-end text-xs font-bold uppercase tracking-wide text-gray-500">
                {t('admin.tables.actions')}
              </th>
            </tr>
          }
          footer={
            waitingOnFilter ? null : (
              <AdminTablePagination
                meta={meta}
                page={activeQuery.page}
                onPageChange={activeQuery.setPage}
                perPage={activeQuery.perPage}
                onPerPageChange={activeQuery.setPerPage}
                isLoading={activeQuery.isFetching}
              />
            )
          }
        >
          {tab === 'carriers' &&
            (carriersQuery.data?.items ?? []).map((carrier) => (
              <tr key={carrier.id} className="hover:bg-[#f7f4f1]/50">
                <td className="px-4 py-3 font-semibold text-diyar-dark">{carrier.name}</td>
                <td className="px-4 py-3 text-start">
                  <TableLtrValue className="font-mono text-xs text-gray-500">
                    {carrier.code}
                  </TableLtrValue>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={carrier.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    name={carrier.name}
                    onEdit={() => openEdit(carrier)}
                    onDelete={() => deleteMutation.mutate({ kind: 'carriers', id: carrier.id })}
                    deleting={deleteMutation.isPending}
                  />
                </td>
              </tr>
            ))}
          {tab === 'zones' &&
            (zonesQuery.data?.items ?? []).map((zone) => (
              <tr key={zone.id} className="hover:bg-[#f7f4f1]/50">
                <td className="px-4 py-3 font-semibold text-diyar-dark">{zone.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {[zone.city, zone.region, zone.postal_prefix].filter(Boolean).join(' · ') || '—'}
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={zone.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    name={zone.name}
                    onEdit={() => openEdit(zone)}
                    onDelete={() => deleteMutation.mutate({ kind: 'zones', id: zone.id })}
                    deleting={deleteMutation.isPending}
                  />
                </td>
              </tr>
            ))}
          {tab === 'methods' &&
            (methodsQuery.data?.items ?? []).map((method) => (
              <tr key={method.id} className="hover:bg-[#f7f4f1]/50">
                <td className="px-4 py-3 font-semibold text-diyar-dark">{method.name}</td>
                <td className="px-4 py-3 text-start">
                  <TableLtrValue className="font-mono text-xs text-gray-500">
                    {method.code}
                  </TableLtrValue>
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={method.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    name={method.name}
                    onEdit={() => openEdit(method)}
                    onDelete={() => deleteMutation.mutate({ kind: 'methods', id: method.id })}
                    deleting={deleteMutation.isPending}
                  />
                </td>
              </tr>
            ))}
          {tab === 'rules' &&
            (rulesQuery.data?.items ?? []).map((rule) => (
              <tr key={rule.id} className="hover:bg-[#f7f4f1]/50">
                <td className="px-4 py-3 font-semibold text-diyar-dark">{rule.rate} SAR</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {rule.min_weight_kg}–{rule.max_weight_kg ?? '∞'} kg
                </td>
                <td className="px-4 py-3">
                  <AdminStatusBadge status={rule.is_active ? 'active' : 'inactive'} />
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    name={`${rule.rate} SAR`}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => deleteMutation.mutate({ kind: 'rules', id: rule.id })}
                    deleting={deleteMutation.isPending}
                  />
                </td>
              </tr>
            ))}
        </AdminResourceTable>
      ) : null}
    </div>
  );
}

function RowActions({
  name,
  onEdit,
  onDelete,
  deleting,
}: {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="flex justify-end gap-1">
      <PermissionGate permission="shipping.manage">
        <button
          type="button"
          onClick={onEdit}
          className={`${ACTION_BTN} border-gray-200 text-gray-600 hover:border-diyar-brown hover:text-diyar-brown`}
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            if (await confirmDeleteShippingItem(t, name)) onDelete();
          }}
          className={`${ACTION_BTN} border-red-200 bg-red-50 text-red-700 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Trash2 size={14} />
        </button>
      </PermissionGate>
    </div>
  );
}
