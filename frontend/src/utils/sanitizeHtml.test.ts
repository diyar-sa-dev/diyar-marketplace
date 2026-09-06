import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml.ts';

describe('sanitizeHtml', () => {
  it('removes script tags and on* attributes', () => {
    const result = sanitizeHtml(
      '<p>Hello</p><script>alert(1)</script><img src="x" onerror="alert(1)" />',
    );

    expect(result).not.toContain('<script');
    expect(result).not.toContain('onerror');
    expect(result).toContain('Hello');
  });

  it('removes iframe tags', () => {
    const result = sanitizeHtml('<iframe src="https://evil.test"></iframe><p>Safe</p>');
    expect(result).not.toContain('iframe');
    expect(result).toContain('Safe');
  });
});
