/** Settings managed outside Admin → Settings (e.g. Feedback → banner modal). */
const HIDDEN_ADMIN_SETTING_KEYS = new Set([
  'platform.announcement_text_ar',
  'platform.announcement_text_en',
  'platform.announcement_cta_ar',
  'platform.announcement_cta_en',
  'platform.announcement_link',
]);

export function isHiddenAdminSetting(fullKey: string): boolean {
  return HIDDEN_ADMIN_SETTING_KEYS.has(fullKey);
}
