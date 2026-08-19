export interface ProviderWorkPolicy {
  policy_enabled: boolean;
  initial_delivery_days: number;
  free_revisions_included: number;
  timeline_by_project_scope: boolean;
  cancellation_notice_hours: number | null;
  custom_terms: string[];
}

export type ProviderWorkPolicyPayload = ProviderWorkPolicy;

export const defaultProviderWorkPolicy = (): ProviderWorkPolicy => ({
  policy_enabled: true,
  initial_delivery_days: 7,
  free_revisions_included: 2,
  timeline_by_project_scope: true,
  cancellation_notice_hours: 24,
  custom_terms: [],
});
