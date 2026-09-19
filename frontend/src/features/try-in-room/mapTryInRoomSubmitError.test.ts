import { describe, expect, it } from 'vitest';
import { mapTryInRoomSubmitError } from './mapTryInRoomSubmitError.ts';

describe('mapTryInRoomSubmitError', () => {
  it('maps 409 to idempotency_conflict', () => {
    expect(
      mapTryInRoomSubmitError({
        message: 'Conflict',
        status: 409,
      }),
    ).toBe('idempotency_conflict');
  });

  it('maps other API errors to request_failed', () => {
    expect(
      mapTryInRoomSubmitError({
        message: 'Error',
        status: 500,
      }),
    ).toBe('request_failed');
  });
});
