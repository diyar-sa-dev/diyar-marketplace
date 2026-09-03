import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { slugifyShippingCode } from '../utils/shippingCode.ts';

export type ShippingTab = 'carriers' | 'zones' | 'methods' | 'rules';

export type CarrierFormValues = {
  name: string;
  code: string;
  is_active: boolean;
};

export type ZoneFormValues = {
  name: string;
  city: string;
  region: string;
  postal_prefix: string;
  priority: string;
  is_active: boolean;
};

export type MethodFormValues = {
  name: string;
  code: string;
  is_active: boolean;
};

export type RuleFormValues = {
  rate: string;
  min_weight_kg: string;
  max_weight_kg: string;
  sort_order: string;
  zone_id: string;
  is_active: boolean;
};

export type ShippingFormSubmit =
  | { kind: 'carriers'; values: CarrierFormValues }
  | { kind: 'zones'; values: ZoneFormValues }
  | { kind: 'methods'; values: MethodFormValues }
  | { kind: 'rules'; values: RuleFormValues };

type ZoneOption = { id: string; name: string };

type AdminShippingFormModalProps = {
  open: boolean;
  kind: ShippingTab;
  mode: 'create' | 'edit';
  isSaving: boolean;
  zoneOptions?: ZoneOption[];
  initialCarrier?: CarrierFormValues;
  initialZone?: ZoneFormValues;
  initialMethod?: MethodFormValues;
  initialRule?: RuleFormValues;
  onClose: () => void;
  onSubmit: (payload: ShippingFormSubmit) => void;
};

function fieldClass(error?: string): string {
  return `w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:border-diyar-brown ${
    error ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
  }`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export function AdminShippingFormModal({
  open,
  kind,
  mode,
  isSaving,
  zoneOptions = [],
  initialCarrier,
  initialZone,
  initialMethod,
  initialRule,
  onClose,
  onSubmit,
}: AdminShippingFormModalProps) {
  const { t } = useLocale();

  if (!open) return null;

  const formKey = `${kind}-${mode}-${initialCarrier?.code ?? initialZone?.name ?? initialMethod?.code ?? initialRule?.rate ?? 'new'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 cursor-pointer"
        onClick={onClose}
        aria-label={t('common.cancel')}
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        <ShippingForm
          key={formKey}
          kind={kind}
          mode={mode}
          isSaving={isSaving}
          zoneOptions={zoneOptions}
          initialCarrier={initialCarrier}
          initialZone={initialZone}
          initialMethod={initialMethod}
          initialRule={initialRule}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

function ShippingForm({
  kind,
  mode,
  isSaving,
  zoneOptions,
  initialCarrier,
  initialZone,
  initialMethod,
  initialRule,
  onClose,
  onSubmit,
}: Omit<AdminShippingFormModalProps, 'open'>) {
  const { t } = useLocale();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const titles: Record<ShippingTab, { create: string; edit: string; hint: string }> = {
    carriers: {
      create: t('admin.shipping.addCarrier'),
      edit: t('admin.shipping.editCarrier'),
      hint: t('admin.shipping.modalHintCarrier'),
    },
    zones: {
      create: t('admin.shipping.addZone'),
      edit: t('admin.shipping.editZone'),
      hint: t('admin.shipping.modalHintZone'),
    },
    methods: {
      create: t('admin.shipping.addMethod'),
      edit: t('admin.shipping.editMethod'),
      hint: t('admin.shipping.modalHintMethod'),
    },
    rules: {
      create: t('admin.shipping.addRule'),
      edit: t('admin.shipping.editRule'),
      hint: t('admin.shipping.modalHintRule'),
    },
  };

  const title = mode === 'create' ? titles[kind].create : titles[kind].edit;

  if (kind === 'carriers') {
    return (
      <CarrierFields
        title={title}
        hint={titles.carriers.hint}
        mode={mode}
        initial={initialCarrier}
        isSaving={isSaving}
        errors={errors}
        setErrors={setErrors}
        onClose={onClose}
        onSubmit={(values) => onSubmit({ kind: 'carriers', values })}
      />
    );
  }

  if (kind === 'zones') {
    return (
      <ZoneFields
        title={title}
        hint={titles.zones.hint}
        mode={mode}
        initial={initialZone}
        isSaving={isSaving}
        errors={errors}
        setErrors={setErrors}
        onClose={onClose}
        onSubmit={(values) => onSubmit({ kind: 'zones', values })}
      />
    );
  }

  if (kind === 'methods') {
    return (
      <MethodFields
        title={title}
        hint={titles.methods.hint}
        mode={mode}
        initial={initialMethod}
        isSaving={isSaving}
        errors={errors}
        setErrors={setErrors}
        onClose={onClose}
        onSubmit={(values) => onSubmit({ kind: 'methods', values })}
      />
    );
  }

  return (
    <RuleFields
      title={title}
      hint={titles.rules.hint}
      mode={mode}
      initial={initialRule}
      zoneOptions={zoneOptions}
      isSaving={isSaving}
      errors={errors}
      setErrors={setErrors}
      onClose={onClose}
      onSubmit={(values) => onSubmit({ kind: 'rules', values })}
    />
  );
}

type FormShellProps = {
  title: string;
  hint: string;
  mode: 'create' | 'edit';
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
};

function FormShell({ title, hint, mode, isSaving, onClose, onSubmit, children }: FormShellProps) {
  const { t } = useLocale();

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-diyar-dark">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
            {mode === 'create' ? t('admin.shipping.create') : t('admin.shipping.save')}
          </button>
        </div>
      </form>
    </>
  );
}

function ActiveToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useLocale();

  return (
    <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="rounded border-gray-300 text-diyar-brown focus:ring-diyar-brown cursor-pointer"
      />
      {t('admin.tables.active')}
    </label>
  );
}

function CarrierFields({
  title,
  hint,
  mode,
  initial,
  isSaving,
  errors,
  setErrors,
  onClose,
  onSubmit,
}: {
  title: string;
  hint: string;
  mode: 'create' | 'edit';
  initial?: CarrierFormValues;
  isSaving: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: (values: CarrierFormValues) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(initial?.code));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  const suggestedCode = useMemo(() => slugifyShippingCode(name, 'cr'), [name]);
  const displayCode = codeTouched ? code : suggestedCode;

  return (
    <FormShell
      title={title}
      hint={hint}
      mode={mode}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        const trimmedName = name.trim();
        const normalizedCode = slugifyShippingCode(displayCode || trimmedName, 'cr');

        if (!trimmedName) nextErrors.name = t('admin.shipping.validation.nameRequired');
        if (!normalizedCode) nextErrors.code = t('admin.shipping.validation.codeRequired');
        else if (normalizedCode.length > 64)
          nextErrors.code = t('admin.shipping.validation.codeInvalid');

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        onSubmit({ name: trimmedName, code: normalizedCode, is_active: isActive });
      }}
    >
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.carrierName')}
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass(errors.name)}
          autoFocus
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.carrierCode')}
        </label>
        <input
          value={displayCode}
          onChange={(event) => {
            setCodeTouched(true);
            setCode(event.target.value);
          }}
          placeholder={suggestedCode || t('admin.shipping.codeAuto')}
          className={`${fieldClass(errors.code)} font-mono`}
          dir="ltr"
        />
        <FieldError message={errors.code} />
      </div>
      <ActiveToggle checked={isActive} onChange={setIsActive} />
    </FormShell>
  );
}

function ZoneFields({
  title,
  hint,
  mode,
  initial,
  isSaving,
  errors,
  setErrors,
  onClose,
  onSubmit,
}: {
  title: string;
  hint: string;
  mode: 'create' | 'edit';
  initial?: ZoneFormValues;
  isSaving: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: (values: ZoneFormValues) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [postalPrefix, setPostalPrefix] = useState(initial?.postal_prefix ?? '');
  const [priority, setPriority] = useState(initial?.priority ?? '0');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  return (
    <FormShell
      title={title}
      hint={hint}
      mode={mode}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        const trimmedName = name.trim();
        if (!trimmedName) nextErrors.name = t('admin.shipping.validation.nameRequired');
        if (priority.trim() && (!Number.isInteger(Number(priority)) || Number(priority) < 0)) {
          nextErrors.priority = t('admin.shipping.validation.priorityInvalid');
        }
        if (postalPrefix.trim().length > 16) {
          nextErrors.postal_prefix = t('admin.shipping.validation.postalInvalid');
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({
          name: trimmedName,
          city: city.trim(),
          region: region.trim(),
          postal_prefix: postalPrefix.trim(),
          priority: String(Number(priority) || 0),
          is_active: isActive,
        });
      }}
    >
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.zoneName')}
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass(errors.name)}
          autoFocus
        />
        <FieldError message={errors.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.zoneCity')}
          </label>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className={fieldClass()}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.zoneRegion')}
          </label>
          <input
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className={fieldClass()}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.zonePostal')}
          </label>
          <input
            value={postalPrefix}
            onChange={(event) => setPostalPrefix(event.target.value)}
            className={fieldClass(errors.postal_prefix)}
            dir="ltr"
          />
          <FieldError message={errors.postal_prefix} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.zonePriority')}
          </label>
          <input
            type="number"
            min={0}
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            className={fieldClass(errors.priority)}
          />
          <FieldError message={errors.priority} />
        </div>
      </div>
      <ActiveToggle checked={isActive} onChange={setIsActive} />
    </FormShell>
  );
}

function MethodFields({
  title,
  hint,
  mode,
  initial,
  isSaving,
  errors,
  setErrors,
  onClose,
  onSubmit,
}: {
  title: string;
  hint: string;
  mode: 'create' | 'edit';
  initial?: MethodFormValues;
  isSaving: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: (values: MethodFormValues) => void;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [codeTouched, setCodeTouched] = useState(Boolean(initial?.code));
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const suggestedCode = useMemo(() => slugifyShippingCode(name, 'mth'), [name]);
  const displayCode = codeTouched ? code : suggestedCode;

  return (
    <FormShell
      title={title}
      hint={hint}
      mode={mode}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        const trimmedName = name.trim();
        const normalizedCode = slugifyShippingCode(displayCode || trimmedName, 'mth');
        if (!trimmedName) nextErrors.name = t('admin.shipping.validation.nameRequired');
        if (!normalizedCode) nextErrors.code = t('admin.shipping.validation.codeRequired');
        else if (normalizedCode.length > 64)
          nextErrors.code = t('admin.shipping.validation.codeInvalid');
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ name: trimmedName, code: normalizedCode, is_active: isActive });
      }}
    >
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.methodName')}
        </label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={fieldClass(errors.name)}
          autoFocus
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.methodCode')}
        </label>
        <input
          value={displayCode}
          onChange={(event) => {
            setCodeTouched(true);
            setCode(event.target.value);
          }}
          placeholder={suggestedCode || t('admin.shipping.codeAuto')}
          className={`${fieldClass(errors.code)} font-mono`}
          dir="ltr"
        />
        <FieldError message={errors.code} />
      </div>
      <ActiveToggle checked={isActive} onChange={setIsActive} />
    </FormShell>
  );
}

function RuleFields({
  title,
  hint,
  mode,
  initial,
  zoneOptions,
  isSaving,
  errors,
  setErrors,
  onClose,
  onSubmit,
}: {
  title: string;
  hint: string;
  mode: 'create' | 'edit';
  initial?: RuleFormValues;
  zoneOptions: ZoneOption[];
  isSaving: boolean;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  onClose: () => void;
  onSubmit: (values: RuleFormValues) => void;
}) {
  const { t } = useLocale();
  const [rate, setRate] = useState(initial?.rate ?? '');
  const [minWeight, setMinWeight] = useState(initial?.min_weight_kg ?? '0');
  const [maxWeight, setMaxWeight] = useState(initial?.max_weight_kg ?? '');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order ?? '0');
  const [zoneId, setZoneId] = useState(initial?.zone_id ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  return (
    <FormShell
      title={title}
      hint={hint}
      mode={mode}
      isSaving={isSaving}
      onClose={onClose}
      onSubmit={(event) => {
        event.preventDefault();
        const nextErrors: Record<string, string> = {};
        const rateValue = Number(rate);
        const minValue = minWeight.trim() === '' ? 0 : Number(minWeight);
        const maxValue = maxWeight.trim() === '' ? null : Number(maxWeight);

        if (rate.trim() === '' || !Number.isFinite(rateValue) || rateValue < 0) {
          nextErrors.rate = t('admin.shipping.validation.rateInvalid');
        }
        if (!Number.isFinite(minValue) || minValue < 0) {
          nextErrors.min_weight_kg = t('admin.shipping.validation.weightInvalid');
        }
        if (maxValue !== null && (!Number.isFinite(maxValue) || maxValue < 0)) {
          nextErrors.max_weight_kg = t('admin.shipping.validation.weightInvalid');
        }
        if (maxValue !== null && Number.isFinite(minValue) && maxValue < minValue) {
          nextErrors.max_weight_kg = t('admin.shipping.validation.weightRange');
        }
        if (sortOrder.trim() && (!Number.isInteger(Number(sortOrder)) || Number(sortOrder) < 0)) {
          nextErrors.sort_order = t('admin.shipping.validation.priorityInvalid');
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        onSubmit({
          rate: String(rateValue),
          min_weight_kg: String(minValue),
          max_weight_kg: maxValue === null ? '' : String(maxValue),
          sort_order: String(Number(sortOrder) || 0),
          zone_id: zoneId,
          is_active: isActive,
        });
      }}
    >
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.selectZone')}
        </label>
        <select
          value={zoneId}
          onChange={(event) => setZoneId(event.target.value)}
          className={`${fieldClass()} cursor-pointer`}
        >
          <option value="">{t('admin.shipping.anyZone')}</option>
          {zoneOptions.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.ruleRate')}
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          className={fieldClass(errors.rate)}
          autoFocus
        />
        <FieldError message={errors.rate} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.ruleMinWeight')}
          </label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={minWeight}
            onChange={(event) => setMinWeight(event.target.value)}
            className={fieldClass(errors.min_weight_kg)}
          />
          <FieldError message={errors.min_weight_kg} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
            {t('admin.shipping.ruleMaxWeight')}
          </label>
          <input
            type="number"
            min={0}
            step="0.001"
            value={maxWeight}
            onChange={(event) => setMaxWeight(event.target.value)}
            className={fieldClass(errors.max_weight_kg)}
            placeholder="∞"
          />
          <FieldError message={errors.max_weight_kg} />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          {t('admin.shipping.ruleSortOrder')}
        </label>
        <input
          type="number"
          min={0}
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          className={fieldClass(errors.sort_order)}
        />
        <FieldError message={errors.sort_order} />
      </div>
      <ActiveToggle checked={isActive} onChange={setIsActive} />
    </FormShell>
  );
}
