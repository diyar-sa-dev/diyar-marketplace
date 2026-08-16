import { describe, expect, it } from 'vitest';
import {
  accountStatusPath,
  isActiveAccount,
  isPendingAccount,
  isSuspendedAccount,
} from './accountStatus.ts';

describe('accountStatus', () => {
  it('detects pending and suspended accounts', () => {
    expect(isPendingAccount('pending')).toBe(true);
    expect(isSuspendedAccount('suspended')).toBe(true);
    expect(isSuspendedAccount('rejected')).toBe(true);
    expect(isActiveAccount('active')).toBe(true);
  });

  it('returns account status routes', () => {
    expect(accountStatusPath('pending')).toBe('/account/pending');
    expect(accountStatusPath('suspended')).toBe('/account/suspended');
    expect(accountStatusPath('active')).toBeNull();
  });
});
