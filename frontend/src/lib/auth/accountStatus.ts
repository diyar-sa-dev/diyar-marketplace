import type { AuthUser } from '../../types/auth.ts';

export type AccountStatus = AuthUser['status'];

export function isPendingAccount(status: AccountStatus | undefined): boolean {
  return status === 'pending';
}

export function isSuspendedAccount(status: AccountStatus | undefined): boolean {
  return status === 'suspended' || status === 'rejected';
}

export function isActiveAccount(status: AccountStatus | undefined): boolean {
  return status === 'active';
}

export function accountStatusPath(status: AccountStatus | undefined): string | null {
  if (isPendingAccount(status)) {
    return '/account/pending';
  }

  if (isSuspendedAccount(status)) {
    return '/account/suspended';
  }

  return null;
}
