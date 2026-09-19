import { dispatchCommand, type DispatchResult } from './commandDispatcher.ts';
import type { RoomCommand } from '../domain/commands/types.ts';
import type { ConstraintViolation } from '../domain/constraints/types.ts';
import { DomainErrorCode, domainError, type DomainError } from '../domain/errors.ts';
import {
  canRedo,
  canUndo,
  createHistoryState,
  popRedoEntry,
  popUndoEntry,
  pushHistoryEntry,
  pushRedoEntry,
  type HistoryEntry,
  type HistoryState,
} from '../domain/history/history.ts';
import { createEmptyDocument, type RoomDesignDocument } from '../domain/models.ts';
import { createDocumentFromPreset } from '../domain/room/initializeFromPreset.ts';

export interface SpatialEngineState {
  document: RoomDesignDocument;
  history: HistoryState;
}

export interface EngineCommandResult {
  ok: true;
  state: SpatialEngineState;
  warnings: ConstraintViolation[];
}

export type EngineResult = EngineCommandResult | { ok: false; error: DomainError };

export function createSpatialEngine(
  width_m: number,
  depth_m: number,
  height_m?: number | null,
): SpatialEngineState {
  return {
    document: createEmptyDocument(width_m, depth_m, height_m),
    history: createHistoryState(),
  };
}

export function createSpatialEngineFromDocument(document: RoomDesignDocument): SpatialEngineState {
  return { document, history: createHistoryState() };
}

export function createSpatialEngineFromPreset(
  presetId: string,
): { ok: true; state: SpatialEngineState } | { ok: false; error: DomainError } {
  const built = createDocumentFromPreset(presetId);
  if (built.ok === false) {
    return { ok: false, error: built.error };
  }
  return { ok: true, state: createSpatialEngineFromDocument(built.document) };
}

function applyEngineCommand(
  state: SpatialEngineState,
  command: RoomCommand,
  recordHistory: boolean,
): EngineResult {
  const result = dispatchCommand(state.document, command);
  if (result.ok === false) {
    return { ok: false, error: result.error };
  }

  let history = state.history;
  if (recordHistory && result.inverse) {
    const entry: HistoryEntry = { forward: command, inverse: result.inverse };
    history = pushHistoryEntry(history, entry);
  }

  return {
    ok: true,
    state: { document: result.document, history },
    warnings: result.warnings,
  };
}

export function executeCommand(state: SpatialEngineState, command: RoomCommand): EngineResult {
  return applyEngineCommand(state, command, true);
}

export function undo(state: SpatialEngineState): EngineResult {
  const popped = popUndoEntry(state.history);
  if (!popped) {
    return { ok: false, error: domainError(DomainErrorCode.INVALID_COMMAND, 'Nothing to undo') };
  }

  const dispatch = dispatchCommand(state.document, popped.entry.inverse);
  if (dispatch.ok === false) {
    return { ok: false, error: dispatch.error };
  }

  const history = pushRedoEntry(popped.state, {
    forward: popped.entry.forward,
    inverse: popped.entry.inverse,
  });

  return {
    ok: true,
    state: { document: dispatch.document, history },
    warnings: dispatch.warnings,
  };
}

export function redo(state: SpatialEngineState): EngineResult {
  const popped = popRedoEntry(state.history);
  if (!popped) {
    return { ok: false, error: domainError(DomainErrorCode.INVALID_COMMAND, 'Nothing to redo') };
  }

  const dispatch = dispatchCommand(state.document, popped.entry.forward);
  if (dispatch.ok === false) {
    return { ok: false, error: dispatch.error };
  }

  const history = pushHistoryEntry(
    { past: popped.state.past, future: popped.state.future },
    { forward: popped.entry.forward, inverse: popped.entry.inverse },
  );

  return {
    ok: true,
    state: { document: dispatch.document, history },
    warnings: dispatch.warnings,
  };
}

export function engineCanUndo(state: SpatialEngineState): boolean {
  return canUndo(state.history);
}

export function engineCanRedo(state: SpatialEngineState): boolean {
  return canRedo(state.history);
}
