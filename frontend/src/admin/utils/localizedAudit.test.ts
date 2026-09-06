import { describe, expect, it } from 'vitest';
import { auditActionTone, localizedAuditAction, localizedAuditResource } from './localizedAudit.ts';

const t = ((key: string) => key) as never;

describe('auditActionTone', () => {
  it('maps destructive actions to debit', () => {
    expect(auditActionTone('user.suspend')).toBe('debit');
    expect(auditActionTone('category.delete')).toBe('debit');
    expect(auditActionTone('product.deactivate')).toBe('debit');
    expect(auditActionTone('provider_review.hide')).toBe('debit');
    expect(auditActionTone('payout.provider.reject')).toBe('debit');
  });

  it('maps constructive actions to credit', () => {
    expect(auditActionTone('category.create')).toBe('credit');
    expect(auditActionTone('vendor.activate')).toBe('credit');
    expect(auditActionTone('payout.vendor.mark_paid')).toBe('credit');
    expect(auditActionTone('payout.provider.mark_paid')).toBe('credit');
    expect(auditActionTone('provider_review.unhide')).toBe('credit');
  });

  it('maps other actions to gold', () => {
    expect(auditActionTone('settings.updated')).toBe('gold');
    expect(auditActionTone('role.permissions.sync')).toBe('gold');
  });

  it('returns neutral when the action is missing', () => {
    expect(auditActionTone(undefined)).toBe('neutral');
    expect(auditActionTone('')).toBe('neutral');
  });
});

describe('localizedAuditAction', () => {
  it('maps provider payout actions to i18n keys', () => {
    expect(localizedAuditAction('payout.provider.reject', t)).toBe(
      'admin.audit.actions.payoutProviderReject',
    );
    expect(localizedAuditAction('payout.provider.approve', t)).toBe(
      'admin.audit.actions.payoutProviderApprove',
    );
    expect(localizedAuditAction('payout.provider.mark_paid', t)).toBe(
      'admin.audit.actions.payoutProviderMarkPaid',
    );
  });
});

describe('localizedAuditResource', () => {
  it('maps provider payout model to i18n key', () => {
    expect(localizedAuditResource('App\\Models\\ProviderPayout', t)).toBe(
      'admin.audit.resources.providerPayout',
    );
  });
});
