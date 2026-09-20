import type { RoomCommand } from '../commands/types.ts';

/** Untrusted payload shape from API / AI providers (before validation). */
export type SuggestedCommandPayload = {
  type: string;
  [key: string]: unknown;
};

export type LayoutSuggestionResponse = {
  commands: SuggestedCommandPayload[];
  provider: string;
  metadata?: Record<string, unknown>;
};

export type ParseSuggestedResult =
  | { ok: true; commands: RoomCommand[] }
  | { ok: false; reason: string };
