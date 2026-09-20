import type { DesignerSession, SessionResult } from './DesignerSession.ts';
import { parseSuggestedCommands } from '../domain/suggestions/parseSuggestedCommands.ts';
import type { SuggestedCommandPayload } from '../domain/suggestions/types.ts';
import type { RoomDesignDocument } from '../domain/models.ts';

export type ApplySuggestedLayoutResult =
  | ({ ok: true } & SessionResult)
  | { ok: false; reason: string; state: SessionResult['state'] };

export function applySuggestedLayout(
  session: DesignerSession,
  document: RoomDesignDocument,
  payloads: SuggestedCommandPayload[],
): ApplySuggestedLayoutResult {
  const knownIds = document.items.map((item) => item.id);
  const parsed = parseSuggestedCommands(payloads, knownIds);
  if (!parsed.ok) {
    return { ok: false, reason: parsed.reason, state: session.getState() };
  }
  const result = session.applyCommands(parsed.commands);
  if (!result.ok) {
    return { ok: false, reason: result.error.message, state: result.state };
  }
  return { ok: true, ...result };
}
