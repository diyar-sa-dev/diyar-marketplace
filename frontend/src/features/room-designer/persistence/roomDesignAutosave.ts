import type { RoomDesignDocument } from '../domain/models.ts';
import { ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS } from './constants.ts';
import type { RoomDesignSyncState } from './types.ts';

export type SaveFn = (document: RoomDesignDocument) => Promise<{ version: number }>;

export interface AutosaveSnapshot {
  syncState: RoomDesignSyncState;
  dirty: boolean;
  lastSavedVersion: number | null;
}

/**
 * Debounced autosave coordinator — no HTTP imports; inject save function from adapter layer.
 */
export class RoomDesignAutosave {
  private dirty = false;
  private syncState: RoomDesignSyncState = 'SYNCED';
  private lastSavedVersion: number | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlightGeneration = 0;
  private latestLocalGeneration = 0;

  constructor(
    private readonly getDocument: () => RoomDesignDocument,
    private readonly save: SaveFn,
    private readonly debounceMs = ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS,
  ) {}

  snapshot(): AutosaveSnapshot {
    return {
      syncState: this.syncState,
      dirty: this.dirty,
      lastSavedVersion: this.lastSavedVersion,
    };
  }

  hydrate(version: number): void {
    this.lastSavedVersion = version;
    this.dirty = false;
    this.syncState = 'SYNCED';
  }

  markDirty(): void {
    this.dirty = true;
    this.syncState = 'LOCAL';
    this.latestLocalGeneration += 1;
    this.scheduleSave();
  }

  /** Flush pending save (e.g. before navigation). */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.dirty) {
      await this.runSave();
    }
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleSave(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.runSave();
    }, this.debounceMs);
  }

  private async runSave(): Promise<void> {
    if (!this.dirty) {
      return;
    }

    const generationAtStart = this.latestLocalGeneration;
    const saveGeneration = ++this.inFlightGeneration;
    this.syncState = 'SYNCING';

    try {
      const result = await this.save(this.getDocument());

      if (saveGeneration !== this.inFlightGeneration) {
        return;
      }

      if (generationAtStart !== this.latestLocalGeneration) {
        this.dirty = true;
        this.syncState = 'LOCAL';
        this.scheduleSave();
        return;
      }

      this.lastSavedVersion = result.version;
      this.dirty = false;
      this.syncState = 'SYNCED';
    } catch (error) {
      if (saveGeneration !== this.inFlightGeneration) {
        return;
      }

      this.dirty = true;
      const code = (error as { code?: string })?.code;
      this.syncState = code === 'version_conflict' ? 'CONFLICT' : 'ERROR';
    }
  }
}
