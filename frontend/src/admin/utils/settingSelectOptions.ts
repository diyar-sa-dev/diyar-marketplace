export type SettingSelectOption = {
  value: string;
  labelKey: string;
};

export const PDF_QUALITY_OPTIONS: SettingSelectOption[] = [
  { value: '/screen', labelKey: 'admin.settings.pdfQuality.screen' },
  { value: '/ebook', labelKey: 'admin.settings.pdfQuality.ebook' },
  { value: '/printer', labelKey: 'admin.settings.pdfQuality.printer' },
  { value: '/prepress', labelKey: 'admin.settings.pdfQuality.prepress' },
];

export function selectOptionsForSetting(fullKey: string): SettingSelectOption[] | null {
  if (fullKey === 'platform.media_pdf_quality') {
    return PDF_QUALITY_OPTIONS;
  }

  return null;
}
