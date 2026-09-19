import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyDocument } from '../domain/models.ts';
import { ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS } from './constants.ts';
import { RoomDesignAutosave } from './roomDesignAutosave.ts';

describe('RoomDesignAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces save until idle window', async () => {
    const save = vi.fn().mockResolvedValue({ version: 2 });
    const doc = createEmptyDocument(4, 4);
    const autosave = new RoomDesignAutosave(() => doc, save);

    autosave.markDirty();
    autosave.markDirty();
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS - 1);
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.snapshot().syncState).toBe('SYNCED');
    expect(autosave.snapshot().dirty).toBe(false);
  });

  it('keeps dirty state when save fails', async () => {
    const save = vi.fn().mockRejectedValue(new Error('network'));
    const autosave = new RoomDesignAutosave(() => createEmptyDocument(3, 3), save);
    autosave.markDirty();

    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS);
    await Promise.resolve();

    const snap = autosave.snapshot();
    expect(snap.dirty).toBe(true);
    expect(snap.syncState).toBe('ERROR');
  });

  it('does not clear dirty when local edits happen during save', async () => {
    let resolveSave: (value: { version: number }) => void = () => {};
    const save = vi.fn(
      () =>
        new Promise<{ version: number }>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const autosave = new RoomDesignAutosave(() => createEmptyDocument(5, 5), save);
    autosave.markDirty();
    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS);

    autosave.markDirty();
    resolveSave({ version: 2 });
    await Promise.resolve();

    expect(autosave.snapshot().dirty).toBe(true);
    expect(autosave.snapshot().syncState).toBe('LOCAL');
  });

  it('coalesces many markDirty calls into one debounced save', async () => {
    const save = vi.fn().mockResolvedValue({ version: 2 });
    const autosave = new RoomDesignAutosave(() => createEmptyDocument(4, 4), save);
    for (let i = 0; i < 25; i += 1) {
      autosave.markDirty();
    }
    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('does not auto-reschedule save after version_conflict', async () => {
    const save = vi.fn().mockRejectedValue(Object.assign(new Error('conflict'), { code: 'version_conflict' }));
    const autosave = new RoomDesignAutosave(() => createEmptyDocument(4, 4), save);
    autosave.markDirty();
    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS * 2);
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.snapshot().syncState).toBe('CONFLICT');
  });

  it('maps version_conflict to CONFLICT sync state', async () => {
    const save = vi.fn().mockRejectedValue(Object.assign(new Error('conflict'), { code: 'version_conflict' }));
    const autosave = new RoomDesignAutosave(() => createEmptyDocument(4, 4), save);
    autosave.markDirty();
    await vi.advanceTimersByTimeAsync(ROOM_DESIGN_AUTOSAVE_DEBOUNCE_MS);
    await Promise.resolve();
    expect(autosave.snapshot().syncState).toBe('CONFLICT');
    expect(autosave.snapshot().dirty).toBe(true);
  });

  it('flush saves immediately when dirty', async () => {
    const save = vi.fn().mockResolvedValue({ version: 3 });
    const autosave = new RoomDesignAutosave(() => createEmptyDocument(2, 2), save);
    autosave.markDirty();

    await autosave.flush();
    expect(save).toHaveBeenCalledTimes(1);
    expect(autosave.snapshot().dirty).toBe(false);
  });
});
