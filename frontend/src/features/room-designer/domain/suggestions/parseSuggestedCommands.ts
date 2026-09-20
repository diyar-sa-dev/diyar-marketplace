import type { RoomCommand } from '../commands/types.ts';
import type { ParseSuggestedResult, SuggestedCommandPayload } from './types.ts';

export const MAX_SUGGESTED_COMMANDS = 50;
export const MAX_BATCH_DEPTH = 2;

/** Layout AI may only rearrange existing items — never mutate catalog snapshots or room size. */
const ALLOWED_TOP_LEVEL = new Set(['MOVE', 'ROTATE', 'BATCH']);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parsePosition(raw: unknown): { x: number; z: number } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const p = raw as Record<string, unknown>;
  if (!isFiniteNumber(p.x) || !isFiniteNumber(p.z)) return null;
  return { x: p.x, z: p.z };
}

function parseOne(
  payload: SuggestedCommandPayload,
  knownItemIds: ReadonlySet<string>,
  depth: number,
): RoomCommand | null {
  if (depth > MAX_BATCH_DEPTH) return null;
  const type = payload.type;
  if (typeof type !== 'string') return null;

  if (type === 'MOVE') {
    const itemId = payload.itemId;
    if (typeof itemId !== 'string' || !knownItemIds.has(itemId)) return null;
    const position_m = parsePosition(payload.position_m);
    if (!position_m) return null;
    return { type: 'MOVE', itemId, position_m };
  }

  if (type === 'ROTATE') {
    const itemId = payload.itemId;
    if (typeof itemId !== 'string' || !knownItemIds.has(itemId)) return null;
    if (!isFiniteNumber(payload.rotation_deg)) return null;
    return { type: 'ROTATE', itemId, rotation_deg: payload.rotation_deg };
  }

  if (type === 'BATCH') {
    if (!Array.isArray(payload.commands)) return null;
    const inner: RoomCommand[] = [];
    for (const entry of payload.commands) {
      if (typeof entry !== 'object' || entry === null) return null;
      const parsed = parseOne(entry as SuggestedCommandPayload, knownItemIds, depth + 1);
      if (!parsed) return null;
      inner.push(parsed);
    }
    if (inner.length === 0) return null;
    return { type: 'BATCH', commands: inner };
  }

  return null;
}

export function parseSuggestedCommands(
  payloads: SuggestedCommandPayload[],
  knownItemIds: Iterable<string>,
): ParseSuggestedResult {
  if (!Array.isArray(payloads)) {
    return { ok: false, reason: 'commands must be an array' };
  }
  if (payloads.length > MAX_SUGGESTED_COMMANDS) {
    return { ok: false, reason: 'too many suggested commands' };
  }

  const ids = new Set(knownItemIds);
  const commands: RoomCommand[] = [];

  for (const payload of payloads) {
    if (typeof payload !== 'object' || payload === null) {
      return { ok: false, reason: 'invalid command entry' };
    }
    if (!ALLOWED_TOP_LEVEL.has(String(payload.type))) {
      return { ok: false, reason: `forbidden command type: ${String(payload.type)}` };
    }
    const parsed = parseOne(payload, ids, 0);
    if (!parsed) {
      return { ok: false, reason: 'malformed or unknown item in suggestion' };
    }
    commands.push(parsed);
  }

  return { ok: true, commands };
}
