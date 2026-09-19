import type { RoomCommand } from '../domain/commands/types.ts';
import type { ConstraintViolation } from '../domain/constraints/types.ts';
import type { DomainError } from '../domain/errors.ts';
import type { RoomDesignDocument } from '../domain/models.ts';
import {
  engineCanRedo,
  engineCanUndo,
  executeCommand,
  redo,
  type SpatialEngineState,
  undo,
} from './spatialEngine.ts';

export type SessionResult =
  | { ok: true; state: SpatialEngineState; warnings: ConstraintViolation[] }
  | { ok: false; error: DomainError; state: SpatialEngineState };

export class DesignerSession {
  private engine: SpatialEngineState;

  /** UI selection — not persisted in document. */
  selectedIds: string[] = [];

  constructor(engine: SpatialEngineState) {
    this.engine = engine;
  }

  getDocument(): RoomDesignDocument {
    return this.engine.document;
  }

  getState(): SpatialEngineState {
    return this.engine;
  }

  canUndo(): boolean {
    return engineCanUndo(this.engine);
  }

  canRedo(): boolean {
    return engineCanRedo(this.engine);
  }

  setSelection(ids: string[]): void {
    this.selectedIds = [...ids];
  }

  applyCommands(commands: RoomCommand[]): SessionResult {
    if (commands.length === 0) {
      return { ok: true, state: this.engine, warnings: [] };
    }
    const batch: RoomCommand =
      commands.length === 1 ? commands[0] : { type: 'BATCH', commands: [...commands] };
    const result = executeCommand(this.engine, batch);
    if (result.ok === false) {
      return { ok: false, error: result.error, state: this.engine };
    }
    this.engine = result.state;
    return { ok: true, state: this.engine, warnings: result.warnings };
  }

  removeSelected(): SessionResult {
    const id = this.selectedIds[0];
    if (!id) {
      return { ok: true, state: this.engine, warnings: [] };
    }
    const result = this.applyCommands([{ type: 'REMOVE_ITEM', itemId: id }]);
    if (result.ok) {
      this.selectedIds = [];
    }
    return result;
  }

  duplicateSelected(): SessionResult {
    const id = this.selectedIds[0];
    if (!id) {
      return { ok: true, state: this.engine, warnings: [] };
    }
    return this.applyCommands([{ type: 'DUPLICATE', itemId: id }]);
  }

  undo(): SessionResult {
    const result = undo(this.engine);
    if (result.ok === false) {
      return { ok: false, error: result.error, state: this.engine };
    }
    this.engine = result.state;
    this.selectedIds = this.selectedIds.filter((id) =>
      this.engine.document.items.some((item) => item.id === id),
    );
    return { ok: true, state: this.engine, warnings: result.warnings };
  }

  redo(): SessionResult {
    const result = redo(this.engine);
    if (result.ok === false) {
      return { ok: false, error: result.error, state: this.engine };
    }
    this.engine = result.state;
    return { ok: true, state: this.engine, warnings: result.warnings };
  }
}
