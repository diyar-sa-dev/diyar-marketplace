import { describe, expect, it } from 'vitest';
import { formatMaterialLines } from './formatMaterials.ts';

describe('formatMaterialLines', () => {
  it('renders string arrays without numeric keys', () => {
    const lines = formatMaterialLines(['kolm', 'wood']);
    expect(lines).toHaveLength(2);
    expect(lines[0]?.value).toBe('kolm');
    expect(lines[0]?.label).toBe('');
  });

  it('renders keyed materials with labels', () => {
    const lines = formatMaterialLines({ main: 'wood', fabric: 'cotton' });
    expect(lines).toHaveLength(2);
    expect(lines[0]?.label).toBe('الهيكل');
  });
});
