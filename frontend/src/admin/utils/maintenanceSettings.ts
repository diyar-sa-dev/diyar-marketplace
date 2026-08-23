const MAINTENANCE_KEYS = new Set([
  'platform.marketplace_maintenance_enabled',
  'platform.maintenance_message_ar',
  'platform.maintenance_message_en',
]);

export function isMaintenanceSetting(fullKey: string): boolean {
  return MAINTENANCE_KEYS.has(fullKey);
}
