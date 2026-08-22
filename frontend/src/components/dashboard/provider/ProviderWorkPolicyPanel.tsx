import { useEffect, useState } from 'react';
import { Info, Plus, Save, Trash2 } from 'lucide-react';
import { useLocale } from '../../../hooks/useLocale.ts';
import { useToast } from '../../../hooks/useToast.ts';
import {
  useProviderWorkPolicy,
  useUpdateProviderWorkPolicy,
} from '../../../hooks/provider/useProviderWorkPolicy.ts';
import { LoadingState } from '../../common/LoadingState.tsx';
import {
  defaultProviderWorkPolicy,
  type ProviderWorkPolicyPayload,
} from '../../../types/providerWorkPolicy.ts';

const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-gray-50/50 placeholder:text-gray-400 text-start';

export function ProviderWorkPolicyPanel() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { data, isLoading } = useProviderWorkPolicy();
  const saveMutation = useUpdateProviderWorkPolicy();
  const [form, setForm] = useState<ProviderWorkPolicyPayload>(defaultProviderWorkPolicy());

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  if (isLoading) {
    return <LoadingState message={t('common.loading')} />;
  }

  const addCustomTerm = () => {
    if (form.custom_terms.length >= 5) {
      return;
    }
    setForm((prev) => ({ ...prev, custom_terms: [...prev.custom_terms, ''] }));
  };

  const updateCustomTerm = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      custom_terms: prev.custom_terms.map((term, i) => (i === index ? value : term)),
    }));
  };

  const removeCustomTerm = (index: number) => {
    setForm((prev) => ({
      ...prev,
      custom_terms: prev.custom_terms.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (
      form.policy_enabled &&
      form.initial_delivery_days <= 0 &&
      form.free_revisions_included <= 0 &&
      !form.timeline_by_project_scope &&
      form.custom_terms.every((term) => !term.trim())
    ) {
      toast.warning(t('providerDashboard.settings.workPolicy.validationRequired'));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        ...form,
        custom_terms: form.custom_terms.map((term) => term.trim()).filter(Boolean),
      });
      toast.success(t('providerDashboard.settings.workPolicy.saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errors.unexpected'));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Info className="mt-0.5 shrink-0 text-blue-600" size={20} />
        <p className="text-sm leading-relaxed text-blue-900">
          {t('providerDashboard.settings.workPolicy.intro')}
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
        <input
          type="checkbox"
          checked={form.policy_enabled}
          onChange={(e) => setForm((prev) => ({ ...prev, policy_enabled: e.target.checked }))}
        />
        {t('providerDashboard.settings.workPolicy.enabled')}
      </label>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            {t('providerDashboard.settings.workPolicy.initialDeliveryDays')}
          </label>
          <input
            type="number"
            min={0}
            max={365}
            disabled={!form.policy_enabled}
            value={form.initial_delivery_days}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                initial_delivery_days: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            {t('providerDashboard.settings.workPolicy.freeRevisions')}
          </label>
          <input
            type="number"
            min={0}
            max={20}
            disabled={!form.policy_enabled}
            value={form.free_revisions_included}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                free_revisions_included: Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">
            {t('providerDashboard.settings.workPolicy.cancellationNoticeHours')}
          </label>
          <input
            type="number"
            min={0}
            max={720}
            disabled={!form.policy_enabled}
            value={form.cancellation_notice_hours ?? ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                cancellation_notice_hours:
                  e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
              }))
            }
            className={INPUT_CLASS}
            placeholder={t('providerDashboard.settings.workPolicy.optional')}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
        <input
          type="checkbox"
          disabled={!form.policy_enabled}
          checked={form.timeline_by_project_scope}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, timeline_by_project_scope: e.target.checked }))
          }
        />
        {t('providerDashboard.settings.workPolicy.timelineByScope')}
      </label>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="font-bold text-diyar-dark">
            {t('providerDashboard.settings.workPolicy.customTermsTitle')}
          </h4>
          <button
            type="button"
            onClick={addCustomTerm}
            disabled={!form.policy_enabled || form.custom_terms.length >= 5}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={14} />
            {t('providerDashboard.settings.workPolicy.addTerm')}
          </button>
        </div>
        <div className="space-y-3">
          {form.custom_terms.map((term, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                disabled={!form.policy_enabled}
                value={term}
                onChange={(e) => updateCustomTerm(index, e.target.value)}
                placeholder={t('providerDashboard.settings.workPolicy.customTermPlaceholder')}
                className={INPUT_CLASS}
                maxLength={500}
              />
              <button
                type="button"
                disabled={!form.policy_enabled}
                onClick={() => removeCustomTerm(index)}
                className="shrink-0 rounded-xl border border-gray-200 p-3 text-red-500 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                aria-label={t('providerDashboard.settings.workPolicy.removeTerm')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saveMutation.isPending}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-600/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={18} />
          {t('providerDashboard.settings.workPolicy.save')}
        </button>
      </div>
    </div>
  );
}
