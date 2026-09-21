import { useCallback, useEffect, useRef, useState } from 'react';
import { composeOptimisticTryInRoomPreview } from './composeOptimisticTryInRoomPreview.ts';
import {
  createTryInRoomJobForProduct,
  createTryInRoomJobForRoomDesign,
  fetchTryInRoomJob,
  fetchTryInRoomResultImage,
} from './tryInRoomApi.ts';
import type { TryInRoomFlowPhase, TryInRoomJob } from './types.ts';
import { mapTryInRoomSubmitError } from './mapTryInRoomSubmitError.ts';
import { validateTryInRoomFile } from './validateTryInRoomFile.ts';

const POLL_MS = 400;
const MAX_POLLS = 75;

function isTerminal(status: TryInRoomJob['status']): boolean {
  return status === 'completed' || status === 'failed';
}

function mapJobError(code: string | null): string {
  if (
    code === 'timeout'
    || code === 'quota_exhausted'
    || code === 'processing_failed'
    || code === 'product_not_available'
  ) {
    return code;
  }

  return 'request_failed';
}

function revokeIfNeeded(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export type UseTryInRoomFlowInput = {
  productId?: string;
  roomDesignId?: string;
  productImageUrl?: string;
};

export function useTryInRoomFlow({
  productId,
  roomDesignId,
  productImageUrl,
}: UseTryInRoomFlowInput) {
  const [phase, setPhase] = useState<TryInRoomFlowPhase>('idle');
  const [job, setJob] = useState<TryInRoomJob | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const idempotencyRef = useRef<string>(crypto.randomUUID());
  const submitLockRef = useRef(false);
  const pollTimerRef = useRef<number | null>(null);
  const pollCountRef = useRef(0);
  const generationRef = useRef(0);
  const optimisticUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    clearPoll();
    submitLockRef.current = false;
    pollCountRef.current = 0;
    setPhase('idle');
    setJob(null);
    setErrorKey(null);
    idempotencyRef.current = crypto.randomUUID();
    setSourceUrl((prev) => {
      revokeIfNeeded(prev);
      return null;
    });
    setOptimisticUrl((prev) => {
      revokeIfNeeded(prev);
      optimisticUrlRef.current = null;
      return null;
    });
    setResultUrl((prev) => {
      revokeIfNeeded(prev);
      resultUrlRef.current = null;
      return null;
    });
  }, [clearPoll]);

  const keepPreview = useCallback((): boolean => {
    return Boolean(resultUrlRef.current || optimisticUrlRef.current);
  }, []);

  const settleJob = useCallback(async (next: TryInRoomJob) => {
    setJob(next);
    if (next.status === 'failed') {
      if (keepPreview()) {
        setPhase('completed');
        return;
      }
      setPhase('failed');
      setErrorKey(mapJobError(next.error_code));
      return;
    }
    if (next.status !== 'completed') {
      return;
    }

    if (!next.result_url) {
      if (keepPreview()) {
        setPhase('completed');
        return;
      }
      setPhase('failed');
      setErrorKey('processing_failed');
      return;
    }

    try {
      const blobUrl = await fetchTryInRoomResultImage(next.id);
      resultUrlRef.current = blobUrl;
      setResultUrl((prev) => {
        revokeIfNeeded(prev);
        return blobUrl;
      });
      setPhase('completed');
    } catch {
      if (keepPreview()) {
        setPhase('completed');
        return;
      }
      setPhase('failed');
      setErrorKey('processing_failed');
    }
  }, [keepPreview]);

  const schedulePoll = useCallback(
    (jobId: string) => {
      clearPoll();
      pollCountRef.current = 0;

      const tick = async () => {
        pollCountRef.current += 1;
        try {
          const next = await fetchTryInRoomJob(jobId);
          if (isTerminal(next.status)) {
            clearPoll();
            await settleJob(next);
            return;
          }
          setJob(next);
          if (pollCountRef.current >= MAX_POLLS) {
            clearPoll();
            if (keepPreview()) {
              setPhase('completed');
              return;
            }
            setPhase('failed');
            setErrorKey('timeout');
            return;
          }
          pollTimerRef.current = window.setTimeout(() => {
            void tick();
          }, POLL_MS);
        } catch {
          if (keepPreview()) {
            setPhase('completed');
            clearPoll();
            return;
          }
          setPhase('failed');
          setErrorKey('request_failed');
          clearPoll();
        }
      };

      pollTimerRef.current = window.setTimeout(() => {
        void tick();
      }, 0);
    },
    [clearPoll, keepPreview, settleJob],
  );

  const submitFile = useCallback(
    async (file: File) => {
      if ((!productId && !roomDesignId) || submitLockRef.current) {
        return;
      }
      const validation = validateTryInRoomFile(file);
      if (validation) {
        setErrorKey(validation);
        setPhase('failed');
        return;
      }

      submitLockRef.current = true;
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      setErrorKey(null);
      setPhase('uploading');
      setResultUrl((prev) => {
        revokeIfNeeded(prev);
        resultUrlRef.current = null;
        return null;
      });
      setOptimisticUrl((prev) => {
        revokeIfNeeded(prev);
        optimisticUrlRef.current = null;
        return null;
      });
      setSourceUrl((prev) => {
        revokeIfNeeded(prev);
        return URL.createObjectURL(file);
      });

      void composeOptimisticTryInRoomPreview(file, productImageUrl)
        .then((url) => {
          if (generation !== generationRef.current) {
            revokeIfNeeded(url);
            return;
          }
          optimisticUrlRef.current = url;
          setOptimisticUrl((prev) => {
            revokeIfNeeded(prev);
            return url;
          });
        })
        .catch(() => {
          // Source photo still appears immediately.
        });

      try {
        const created = productId
          ? await createTryInRoomJobForProduct(productId, file, idempotencyRef.current)
          : await createTryInRoomJobForRoomDesign(roomDesignId!, file, idempotencyRef.current);
        if (generation !== generationRef.current) {
          return;
        }
        setJob(created);
        if (isTerminal(created.status)) {
          await settleJob(created);
          return;
        }
        setPhase('polling');
        schedulePoll(created.id);
      } catch (error: unknown) {
        if (generation !== generationRef.current) {
          return;
        }
        setPhase('failed');
        setErrorKey(mapTryInRoomSubmitError(error));
      } finally {
        submitLockRef.current = false;
      }
    },
    [productId, productImageUrl, roomDesignId, schedulePoll, settleJob],
  );

  useEffect(() => {
    return () => {
      generationRef.current += 1;
      clearPoll();
      setSourceUrl((prev) => {
        revokeIfNeeded(prev);
        return null;
      });
      setOptimisticUrl((prev) => {
        revokeIfNeeded(prev);
        optimisticUrlRef.current = null;
        return null;
      });
      setResultUrl((prev) => {
        revokeIfNeeded(prev);
        resultUrlRef.current = null;
        return null;
      });
    };
  }, [clearPoll]);

  const displayUrl = resultUrl ?? optimisticUrl ?? sourceUrl;
  const confirming = (phase === 'uploading' || phase === 'polling') && !resultUrl;

  return {
    phase,
    job,
    previewUrl: displayUrl ?? sourceUrl,
    sourceUrl,
    resultUrl: displayUrl,
    confirming,
    errorKey,
    submitFile,
    reset,
  };
}
