import { isApiErrorDetail } from '../../utils/errors.ts';

export type TryInRoomSubmitErrorKey =
  | 'idempotency_conflict'
  | 'request_failed'
  | 'invalid_type'
  | 'file_too_large';

export function mapTryInRoomSubmitError(error: unknown): TryInRoomSubmitErrorKey {
  if (isApiErrorDetail(error)) {
    if (error.status === 409) {
      return 'idempotency_conflict';
    }
  }

  return 'request_failed';
}
