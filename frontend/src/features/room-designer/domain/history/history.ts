import { MAX_HISTORY } from '../constants.ts';
import type { RoomCommand } from '../commands/types.ts';

export interface HistoryEntry {
  forward: RoomCommand;
  inverse: RoomCommand;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export function createHistoryState(): HistoryState {
  return { past: [], future: [] };
}

export function pushHistoryEntry(state: HistoryState, entry: HistoryEntry): HistoryState {
  const past = [...state.past, entry];
  if (past.length > MAX_HISTORY) {
    past.splice(0, past.length - MAX_HISTORY);
  }
  return { past, future: [] };
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}

export function popUndoEntry(state: HistoryState): { entry: HistoryEntry; state: HistoryState } | null {
  if (state.past.length === 0) return null;
  const past = [...state.past];
  const entry = past.pop() as HistoryEntry;
  return { entry, state: { past, future: state.future } };
}

export function pushRedoEntry(state: HistoryState, entry: HistoryEntry): HistoryState {
  return { ...state, future: [...state.future, entry] };
}

export function popRedoEntry(state: HistoryState): { entry: HistoryEntry; state: HistoryState } | null {
  if (state.future.length === 0) return null;
  const future = [...state.future];
  const entry = future.pop() as HistoryEntry;
  return { entry, state: { past: state.past, future } };
}
