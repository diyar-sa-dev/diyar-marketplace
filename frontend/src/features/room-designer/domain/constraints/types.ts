import type { DomainErrorCode } from '../errors.ts';

export type ConstraintSeverity = 'block' | 'warn';

export interface ConstraintViolation {
  code: DomainErrorCode | 'ITEM_OVERLAP';
  severity: ConstraintSeverity;
  message: string;
  itemIds?: string[];
}

export interface ConstraintResult {
  valid: boolean;
  violations: ConstraintViolation[];
  warnings: ConstraintViolation[];
}

export function emptyConstraintResult(): ConstraintResult {
  return { valid: true, violations: [], warnings: [] };
}
