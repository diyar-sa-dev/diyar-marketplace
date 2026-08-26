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
  'payout.affiliate.mark_processing': 'admin.audit.actions.payoutAffiliateMarkProcessing',
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
  'blog_article.create': 'admin.audit.actions.blogArticleCreate',
  'blog_article.update': 'admin.audit.actions.blogArticleUpdate',
  'blog_article.delete': 'admin.audit.actions.blogArticleDelete',
  'blog_article.publish': 'admin.audit.actions.blogArticlePublish',
  'blog_article.unpublish': 'admin.audit.actions.blogArticleUnpublish',
  'blog_article.archive': 'admin.audit.actions.blogArticleArchive',
  'blog_category.create': 'admin.audit.actions.blogCategoryCreate',
  'blog_category.update': 'admin.audit.actions.blogCategoryUpdate',
  'blog_category.delete': 'admin.audit.actions.blogCategoryDelete',
  'blog_tag.create': 'admin.audit.actions.blogTagCreate',
  'blog_tag.update': 'admin.audit.actions.blogTagUpdate',
  'blog_tag.delete': 'admin.audit.actions.blogTagDelete',
  'project.create': 'admin.audit.actions.projectCreate',
  'project.update': 'admin.audit.actions.projectUpdate',
  'project.delete': 'admin.audit.actions.projectDelete',
  'project.publish': 'admin.audit.actions.projectPublish',
  'project.unpublish': 'admin.audit.actions.projectUnpublish',
  'project.archive': 'admin.audit.actions.projectArchive',
  'b2b_company.create': 'admin.audit.actions.b2bCompanyCreate',
  'b2b_company.update': 'admin.audit.actions.b2bCompanyUpdate',
  'b2b_company.delete': 'admin.audit.actions.b2bCompanyDelete',
  'b2b_company.publish': 'admin.audit.actions.b2bCompanyPublish',
  'b2b_company.unpublish': 'admin.audit.actions.b2bCompanyUnpublish',
  'b2b_company.archive': 'admin.audit.actions.b2bCompanyArchive',
  'b2b_company.verify': 'admin.audit.actions.b2bCompanyVerify',
  'b2b_company.reject_verification': 'admin.audit.actions.b2bCompanyRejectVerification',
  'b2b_company.feature': 'admin.audit.actions.b2bCompanyFeature',
  'b2b_company.unfeature': 'admin.audit.actions.b2bCompanyUnfeature',
  'b2b_category.create': 'admin.audit.actions.b2bCategoryCreate',
  'b2b_category.update': 'admin.audit.actions.b2bCategoryUpdate',
  'b2b_category.delete': 'admin.audit.actions.b2bCategoryDelete',
  'b2b_tag.create': 'admin.audit.actions.b2bTagCreate',
  'chat.reports.list': 'admin.audit.actions.chatReportsList',
  'chat.report.view': 'admin.audit.actions.chatReportView',
  'chat.report.resolve': 'admin.audit.actions.chatReportResolve',
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
  'App\\Models\\BlogArticle': 'admin.audit.resources.blogArticle',
  'App\\Models\\BlogCategory': 'admin.audit.resources.blogCategory',
  'App\\Models\\BlogTag': 'admin.audit.resources.blogTag',
  'App\\Models\\Project': 'admin.audit.resources.project',
  'App\\Models\\B2bCompany': 'admin.audit.resources.b2bCompany',
  'App\\Models\\B2bCategory': 'admin.audit.resources.b2bCategory',
  'App\\Models\\B2bTag': 'admin.audit.resources.b2bTag',
  'App\\Models\\ChatMessageReport': 'admin.audit.resources.chatMessageReport',
};

export const AUDIT_ACTION_FILTER_OPTIONS = Object.keys(ACTION_KEYS);

function normalizeAuditAction(action: string): string {
  return action.trim().toLowerCase().replace(/\s+/g, '_');
}

export function localizedAuditAction(action: string | null | undefined, t: TranslateFn): string {
  if (!action) {
    return '—';
  }

  const normalized = normalizeAuditAction(action);
  const key = ACTION_KEYS[normalized] ?? ACTION_KEYS[action.trim()];
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
