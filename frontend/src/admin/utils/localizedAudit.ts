import type { TranslateFn } from '../../lib/i18n/types.ts';

const ACTION_KEYS: Record<string, string> = {
  'settings.updated': 'admin.audit.actions.settingsUpdated',
  'category.create': 'admin.audit.actions.categoryCreate',
  'category.update': 'admin.audit.actions.categoryUpdate',
  'category.delete': 'admin.audit.actions.categoryDelete',
  'user.suspend': 'admin.audit.actions.userSuspend',
  'user.activate': 'admin.audit.actions.userActivate',
  'user.role.assign': 'admin.audit.actions.userRoleAssign',
  'user.role.revoke': 'admin.audit.actions.userRoleRevoke',
  'vendor.suspend': 'admin.audit.actions.vendorSuspend',
  'vendor.activate': 'admin.audit.actions.vendorActivate',
  'provider.suspend': 'admin.audit.actions.providerSuspend',
  'provider.activate': 'admin.audit.actions.providerActivate',
  'product.activate': 'admin.audit.actions.productActivate',
  'product.deactivate': 'admin.audit.actions.productDeactivate',
  'product.archive': 'admin.audit.actions.productArchive',
  'order.cancel': 'admin.audit.actions.orderCancel',
  'coupon.activate': 'admin.audit.actions.couponActivate',
  'coupon.deactivate': 'admin.audit.actions.couponDeactivate',
  'payout.vendor.approve': 'admin.audit.actions.payoutVendorApprove',
  'payout.vendor.reject': 'admin.audit.actions.payoutVendorReject',
  'payout.vendor.mark_paid': 'admin.audit.actions.payoutVendorMarkPaid',
  'payout.affiliate.approve': 'admin.audit.actions.payoutAffiliateApprove',
  'payout.affiliate.reject': 'admin.audit.actions.payoutAffiliateReject',
  'payout.affiliate.mark_paid': 'admin.audit.actions.payoutAffiliateMarkPaid',
  'affiliate_link.disable': 'admin.audit.actions.affiliateLinkDisable',
  'return.process_refund': 'admin.audit.actions.returnProcessRefund',
  'return.submit_for_review': 'admin.audit.actions.returnSubmitForReview',
  'return.approve': 'admin.audit.actions.returnApprove',
  'return.reject': 'admin.audit.actions.returnReject',
  'return.mark_received': 'admin.audit.actions.returnMarkReceived',
  'return.mark_inspected': 'admin.audit.actions.returnMarkInspected',
  'role.permissions.sync': 'admin.audit.actions.rolePermissionsSync',
  'provider_review.hide': 'admin.audit.actions.providerReviewHide',
  'provider_review.unhide': 'admin.audit.actions.providerReviewUnhide',
};

const RESOURCE_KEYS: Record<string, string> = {
  'App\\Models\\SystemSetting': 'admin.audit.resources.systemSetting',
  'App\\Models\\Category': 'admin.audit.resources.category',
  'App\\Models\\User': 'admin.audit.resources.user',
  'App\\Models\\VendorAccount': 'admin.audit.resources.vendorAccount',
  'App\\Models\\ProviderAccount': 'admin.audit.resources.providerAccount',
  'App\\Models\\Product': 'admin.audit.resources.product',
  'App\\Models\\Order': 'admin.audit.resources.order',
  'App\\Models\\Coupon': 'admin.audit.resources.coupon',
  'App\\Models\\VendorPayout': 'admin.audit.resources.vendorPayout',
  'App\\Models\\AffiliatePayout': 'admin.audit.resources.affiliatePayout',
  'App\\Models\\AffiliateLink': 'admin.audit.resources.affiliateLink',
  'App\\Models\\ReturnRequest': 'admin.audit.resources.returnRequest',
  'App\\Models\\Role': 'admin.audit.resources.role',
  'App\\Models\\ProviderReview': 'admin.audit.resources.providerReview',
  'App\\Models\\AffiliateProfile': 'admin.audit.resources.affiliateProfile',
};

export const AUDIT_ACTION_FILTER_OPTIONS = Object.keys(ACTION_KEYS);

export function localizedAuditAction(action: string | null | undefined, t: TranslateFn): string {
  if (!action) {
    return '—';
  }

  const key = ACTION_KEYS[action];
  return key ? t(key as never) : action.replace(/[._]/g, ' ');
}

export function localizedAuditResource(
  resourceType: string | null | undefined,
  t: TranslateFn,
): string {
  if (!resourceType) {
    return t('admin.dashboard.system');
  }

  const key = RESOURCE_KEYS[resourceType];
  if (key) {
    return t(key as never);
  }

  const shortName = resourceType.split('\\').pop() ?? resourceType;
  return shortName.replace(/([A-Z])/g, ' $1').trim();
}
