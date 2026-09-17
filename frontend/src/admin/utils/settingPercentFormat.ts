type PercentSettingConfig = {
  /** DB stores 0.15 → UI shows 15. When false, DB already stores whole percent. */
  ratio: boolean;
  min: number;
  max: number;
  step: number;
};

const PERCENT_ADMIN_SETTINGS: Record<string, PercentSettingConfig> = {
  'feature.visual_search_min_similarity': { ratio: true, min: 10, max: 100, step: 1 },
  'commerce.vat_rate': { ratio: true, min: 0, max: 100, step: 1 },
  'services.platform_commission_rate': { ratio: true, min: 0, max: 100, step: 1 },
  'affiliate.platform_min_commission_percent': { ratio: false, min: 0, max: 100, step: 1 },
  'affiliate.platform_max_commission_percent': { ratio: false, min: 0, max: 100, step: 1 },
};

export function getPercentSettingConfig(fullKey: string): PercentSettingConfig | null {
  return PERCENT_ADMIN_SETTINGS[fullKey] ?? null;
}

export function isPercentAdminSetting(fullKey: string): boolean {
  return fullKey in PERCENT_ADMIN_SETTINGS;
}

function clampPercent(value: number, config: PercentSettingConfig): number {
  return Math.max(config.min, Math.min(config.max, value));
}

/** Backend value → admin input display (e.g. 0.15 → 15, or 30 → 30). */
export function toAdminPercentDisplay(fullKey: string, value: unknown): string {
  const config = getPercentSettingConfig(fullKey);
  if (!config) {
    return String(value ?? '');
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return '';
  }

  const percent = config.ratio ? numeric * 100 : numeric;

  return String(Number(percent.toFixed(config.step < 1 ? 2 : 0)));
}

/** Admin percent input → backend value string. */
export function fromAdminPercentInput(fullKey: string, input: string): string {
  const config = getPercentSettingConfig(fullKey);
  if (!config) {
    return input;
  }

  const percent = Number(input.replace(/%/g, '').trim());
  if (!Number.isFinite(percent)) {
    return input;
  }

  const clamped = clampPercent(percent, config);

  if (config.ratio) {
    return String(Number((clamped / 100).toFixed(4)));
  }

  return String(Number(clamped.toFixed(config.step < 1 ? 2 : 0)));
}

/** Backend value → admin effective label (15%). */
export function formatAdminPercentEffective(fullKey: string, value: unknown): string {
  const display = toAdminPercentDisplay(fullKey, value);

  return display === '' ? '—' : `${display}%`;
}
