import { describe, expect, it } from 'vitest';
import { validateTryInRoomFile } from './validateTryInRoomFile.ts';

describe('validateTryInRoomFile', () => {
  it('accepts allowed types within size limit', () => {
    const file = new File([new Uint8Array(100)], 'room.png', { type: 'image/png' });
    expect(validateTryInRoomFile(file)).toBeNull();
  });

  it('rejects disallowed mime', () => {
    const file = new File([new Uint8Array(10)], 'x.pdf', { type: 'application/pdf' });
    expect(validateTryInRoomFile(file)).toBe('invalid_type');
  });

  it('rejects oversized files', () => {
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'big.jpg', {
      type: 'image/jpeg',
    });
    expect(validateTryInRoomFile(file)).toBe('file_too_large');
  });
});
