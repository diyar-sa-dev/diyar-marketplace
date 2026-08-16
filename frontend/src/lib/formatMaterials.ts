const MATERIAL_LABELS: Record<string, string> = {
  main: 'الهيكل',
  fabric: 'القماش',
  filling: 'الحشوة',
};

export interface MaterialLine {
  key: string;
  label: string;
  value: string;
}

export function formatMaterialLines(
  materials: Record<string, string> | string[] | null | undefined,
  labelMap: Record<string, string> = MATERIAL_LABELS,
): MaterialLine[] {
  if (!materials) {
    return [];
  }

  if (Array.isArray(materials)) {
    return materials
      .filter((value) => typeof value === 'string' && value.trim() !== '')
      .map((value, index) => ({
        key: `item-${index}`,
        label: '',
        value: value.trim(),
      }));
  }

  return Object.entries(materials)
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([key, value]) => ({
      key,
      label: labelMap[key] ?? key,
      value: value.trim(),
    }));
}
