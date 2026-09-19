import { useCallback, useEffect, useRef, useState } from 'react';
import { createTryInRoomJobForProduct, fetchTryInRoomJob } from './tryInRoomApi.ts';
import type { TryInRoomFlowPhase, TryInRoomJob } from './types.ts';
import { mapTryInRoomSubmitError } from './mapTryInRoomSubmitError.ts';
import { validateTryInRoomFile } from './validateTryInRoomFile.ts';

const POLL_MS = 2000;
const MAX_POLLS = 90;

function isTerminal(status: TryInRoomJob['status']): boolean {
  return status === 'completed' || status === 'failed';
}

export function useTryInRoomFlow(productId: string | undefined) {
  const [phase, setPhase] = useState<TryInRoomFlowPhase>('idle');
  const [job, setJob] = useState<TryInRoomJob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const idempotencyRef = useRef<string>(crypto.randomUUID());
  const submitLockRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);
  const pollCountRef = useRef(0);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPoll();
    submitLockRef.current = false;
    pollCountRef.current = 0;
    setPhase('idle');
    setJob(null);
    setErrorKey(null);
    idempotencyRef.current = crypto.randomUUID();
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, [clearPoll]);

  const schedulePoll = useCallback(
    (jobId: string) => {
      clearPoll();
      pollCountRef.current = 0;

      const tick = async () => {
        pollCountRef.current += 1;
        try {
          const next = await fetchTryInRoomJob(jobId);
          setJob(next);
          if (isTerminal(next.status)) {
            setPhase(next.status === 'completed' ? 'completed' : 'failed');
            clearPoll();
            return;
          }
          if (pollCountRef.current >= MAX_POLLS) {
            setPhase('failed');
            setErrorKey('timeout');
            clearPoll();
            return;
          }
          pollTimerRef.current = window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } catch {
          setPhase('failed');
          setErrorKey('request_failed');
          clearPoll();
        }
      };

      pollTimerRef.current = window.setTimeout(() => {
        void tick();
      }, POLL_MS);
    },
    [clearPoll],
  );

  const submitFile = useCallback(
    async (file: File) => {
      if (!productId || submitLockRef.current) {
        return;
      }
      const validation = validateTryInRoomFile(file);
      if (validation) {
        setErrorKey(validation);
        setPhase('failed');
        return;
      }

      submitLockRef.current = true;
      setErrorKey(null);
      setPhase('uploading');

      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });

      try {
        const created = await createTryInRoomJobForProduct(
          productId,
          file,
          idempotencyRef.current,
        );
        setJob(created);
        if (isTerminal(created.status)) {
          setPhase(created.status === 'completed' ? 'completed' : 'failed');
          return;
        }
        setPhase('polling');
        schedulePoll(created.id);
      } catch (error: unknown) {
        setPhase('failed');
        setErrorKey(mapTryInRoomSubmitError(error));
      } finally {
        submitLockRef.current = false;
      }
    },
    [productId, schedulePoll],
  );

  useEffect(() => {
    return () => {
      clearPoll();
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
    };
  }, [clearPoll]);

  return {
    phase,
    job,
    previewUrl,
    errorKey,
    submitFile,
    reset,
  };
}
