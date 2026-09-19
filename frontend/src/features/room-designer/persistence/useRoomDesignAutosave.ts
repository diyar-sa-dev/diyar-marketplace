import type { AxiosError } from 'axios';
import { useCallback, useEffect, useRef } from 'react';
import type { RoomDesignDocument } from '../domain/models.ts';
import { updateRoomDesign } from './roomDesignApi.ts';
import { RoomDesignAutosave, type AutosaveSnapshot } from './roomDesignAutosave.ts';

export function useRoomDesignAutosave(
  designId: string | undefined,
  initialVersion: number | undefined,
  getDocument: () => RoomDesignDocument,
): {
  markDirty: () => void;
  flush: () => Promise<void>;
  snapshot: () => AutosaveSnapshot | null;
} {
  const versionRef = useRef(initialVersion ?? 0);
  const getDocumentRef = useRef(getDocument);
  getDocumentRef.current = getDocument;

  const autosaveRef = useRef<RoomDesignAutosave | null>(null);

  useEffect(() => {
    versionRef.current = initialVersion ?? versionRef.current;
  }, [initialVersion]);

  useEffect(() => {
    if (!designId || initialVersion == null) {
      autosaveRef.current = null;
      return undefined;
    }

    const autosave = new RoomDesignAutosave(
      () => getDocumentRef.current(),
      async (document) => {
        try {
          const record = await updateRoomDesign(designId, {
            expected_version: versionRef.current,
            document,
          });
          versionRef.current = record.version;
          return { version: record.version };
        } catch (error) {
          const axiosError = error as AxiosError<{ code?: string }>;
          const code = axiosError.response?.data?.code;
          const wrapped =
            error instanceof Error ? error : new Error('room_design_save_failed');
          throw Object.assign(wrapped, { code });
        }
      },
    );
    autosave.hydrate(initialVersion);
    autosaveRef.current = autosave;

    return () => {
      void autosave.flush();
      autosave.dispose();
      autosaveRef.current = null;
    };
  }, [designId, initialVersion]);

  const markDirty = useCallback(() => {
    autosaveRef.current?.markDirty();
  }, []);

  const flush = useCallback(async () => {
    await autosaveRef.current?.flush();
  }, []);

  const snapshot = useCallback(() => autosaveRef.current?.snapshot() ?? null, []);

  return { markDirty, flush, snapshot };
}
