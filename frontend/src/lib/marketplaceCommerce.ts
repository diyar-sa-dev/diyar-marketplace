import { isAdminOnlyAccount, type UserRoleLike } from './auth/roles.ts';

/** Hide cart/checkout/booking CTAs for operations-only (admin-only) accounts browsing the public store. */
export function shouldHideMarketplaceCommerce(roles: UserRoleLike[] | undefined): boolean {
  return isAdminOnlyAccount(roles);
}
