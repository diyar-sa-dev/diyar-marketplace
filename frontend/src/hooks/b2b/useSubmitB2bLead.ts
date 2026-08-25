import { useMutation } from '@tanstack/react-query';
import { submitB2bLead } from '../../api/b2b.ts';
import type { SubmitB2bLeadPayload } from '../../types/b2b.ts';

export function useSubmitB2bLead(slug: string) {
  return useMutation({
    mutationFn: (payload: SubmitB2bLeadPayload) => submitB2bLead(slug, payload),
  });
}
