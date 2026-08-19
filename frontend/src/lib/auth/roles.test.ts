import { describe, expect, it } from 'vitest';
import {
  canAccessPortal,
  canAccessPath,
  getAccessibleDashboardPortals,
  hasAnyRole,
  hasCustomerRole,
  isVendorOnlyAccount,
  primaryDashboardPath,
  resolveAccountHubPath,
  resolveDashboardEntryPath,
  resolvePostAuthPath,
  resolveProfileAddressesPath,
  resolveSafeReturnPath,
  requiresCustomerRoleForProfilePath,
  RoleName,
  VENDOR_SETTINGS_ACCOUNT_PATH,
} from './roles.ts';
import { resolveLoginMethod, isValidPasswordClient, getPasswordStrength } from './validation.ts';

describe('auth roles', () => {
  it('detects vendor role', () => {
    expect(hasAnyRole([{ name: 'vendor' }], [RoleName.Vendor])).toBe(true);
  });

  it('routes single-role vendor users directly to vendor dashboard', () => {
    expect(primaryDashboardPath([{ name: 'vendor', status: 'active' }])).toBe('/dashboard/vendor');
  });

  it('routes provider+customer users directly to provider dashboard', () => {
    expect(
      resolveDashboardEntryPath([
        { name: 'provider', status: 'active' },
        { name: 'customer', status: 'active' },
      ]),
    ).toBe('/dashboard/service');
  });

  it('routes customer-only users to the store home', () => {
    expect(resolveDashboardEntryPath([{ name: 'customer', status: 'active' }])).toBe('/');
    expect(resolvePostAuthPath([{ name: 'customer', status: 'active' }])).toBe('/');
  });

  it('does not restore forbidden dashboard paths after auth', () => {
    const roles = [{ name: 'customer', status: 'active' }];
    expect(canAccessPath(roles, '/dashboard/affiliate')).toBe(false);
    expect(resolveSafeReturnPath('/dashboard/affiliate', roles)).toBe('/');
  });

  it('restores accessible return paths after auth', () => {
    const roles = [{ name: 'customer', status: 'active' }];
    expect(resolveSafeReturnPath('/profile/personal-info', roles)).toBe('/profile/personal-info');
  });

  it('routes vendor users to their dashboard from safe return helper', () => {
    const roles = [{ name: 'vendor', status: 'active' }];
    expect(resolveSafeReturnPath('/dashboard/affiliate', roles)).toBe('/dashboard/vendor');
  });

  it('routes multi-role users to dashboard picker', () => {
    expect(
      resolveDashboardEntryPath([
        { name: 'vendor', status: 'active' },
        { name: 'provider', status: 'active' },
      ]),
    ).toBe('/dashboard');
  });

  it('returns only accessible portals for the user', () => {
    expect(
      getAccessibleDashboardPortals([
        { name: 'provider', status: 'active' },
        { name: 'customer', status: 'active' },
      ]).map((portal) => portal.key),
    ).toEqual(['service']);
  });

  it('ignores inactive dashboard roles', () => {
    expect(
      getAccessibleDashboardPortals([{ name: 'vendor', status: 'pending' }]).map(
        (portal) => portal.key,
      ),
    ).toEqual([]);
  });

  it('allows admin to access every portal', () => {
    expect(
      getAccessibleDashboardPortals([{ name: 'admin', status: 'active' }]).map(
        (portal) => portal.key,
      ),
    ).toEqual(['vendor', 'service', 'affiliate']);
  });

  it('checks portal access securely by role', () => {
    expect(canAccessPortal([{ name: 'vendor', status: 'active' }], 'vendor')).toBe(true);
    expect(canAccessPortal([{ name: 'vendor', status: 'active' }], 'service')).toBe(false);
  });

  it('routes vendor-only accounts to vendor settings account tab', () => {
    expect(resolveAccountHubPath([{ name: 'vendor', status: 'active' }])).toBe(
      VENDOR_SETTINGS_ACCOUNT_PATH,
    );
    expect(isVendorOnlyAccount([{ name: 'vendor', status: 'active' }])).toBe(true);
  });

  it('routes provider-only accounts to provider settings account tab', () => {
    expect(resolveAccountHubPath([{ name: 'provider', status: 'active' }])).toBe(
      '/dashboard/service/settings?tab=account',
    );
  });

  it('routes dual-role vendor+customer users to customer profile', () => {
    const roles = [
      { name: 'vendor', status: 'active' },
      { name: 'customer', status: 'active' },
    ];
    expect(resolveAccountHubPath(roles)).toBe('/profile');
    expect(hasCustomerRole(roles)).toBe(true);
    expect(isVendorOnlyAccount(roles)).toBe(false);
  });

  it('routes pending customer role to profile hub', () => {
    expect(
      resolveAccountHubPath([
        { name: 'vendor', status: 'active' },
        { name: 'customer', status: 'pending' },
      ]),
    ).toBe('/profile');
  });

  it('allows delivery addresses page for all authenticated roles', () => {
    expect(requiresCustomerRoleForProfilePath('/profile/addresses')).toBe(false);
    expect(resolveProfileAddressesPath([{ name: 'vendor', status: 'active' }])).toBe(
      '/profile/addresses',
    );
  });
});

describe('auth validation', () => {
  it('resolves email login method', () => {
    expect(resolveLoginMethod('user@example.com')).toBe('email');
  });

  it('resolves phone login method', () => {
    expect(resolveLoginMethod('501234567')).toBe('phone');
  });

  it('validates password policy client-side', () => {
    expect(isValidPasswordClient('Password123!')).toBe(true);
    expect(isValidPasswordClient('short')).toBe(false);
  });

  it('scores password strength against policy', () => {
    expect(getPasswordStrength('').level).toBe('empty');
    expect(getPasswordStrength('abc').level).toBe('weak');
    expect(getPasswordStrength('abcdefgh').level).toBe('fair');
    expect(getPasswordStrength('password1').level).toBe('good');
    expect(getPasswordStrength('Password123!').level).toBe('strong');
  });
});
