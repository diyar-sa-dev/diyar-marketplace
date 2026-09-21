import { useCallback, useEffect, useReducer, useRef, useState, type MutableRefObject } from 'react';
import { DesignerSession } from '../application/DesignerSession.ts';
import type { SpatialEngineState } from '../application/spatialEngine.ts';
import type { RendererInteraction } from '../renderer/types.ts';
import {
  DEFAULT_PROJECTION_MODE,
  rendererBackendKey,
  type RoomProjectionMode,
} from '../renderer/projectionMode.ts';
import { DEFAULT_SCALE_PX_PER_M } from '../renderer/types.ts';
import { createRoomRenderer } from '../renderer/createRoomRenderer.ts';
import type { RoomRenderer } from '../renderer/types.ts';
import { useContainerSize } from './useContainerSize.ts';
import { ShimmerBone } from '../../try-in-room/TryInRoomShimmer.tsx';

export type RoomDesignerCanvasHostProps = {
  engine: SpatialEngineState;
  /** Reset session when loading a different persisted design (not on every local edit). */
  sessionResetKey?: string;
  widthPx?: number;
  heightPx?: number;
  fillContainer?: boolean;
  touchFriendly?: boolean;
  scalePxPerM?: number;
  /** Stage 30.14 — presentation only; not written to persisted document. */
  projection?: RoomProjectionMode;
  className?: string;
  sessionRef?: MutableRefObject<DesignerSession | null>;
  onEngineChange?: (state: SpatialEngineState) => void;
  onSelectionChange?: (ids: string[]) => void;
};

/**
 * Orchestrates lazy Fabric renderer + DesignerSession.
 * Domain state lives in session ref — not updated on every pointer move via React props.
 */
export function RoomDesignerCanvasHost({
  engine: initialEngine,
  sessionResetKey,
  widthPx = 640,
  heightPx = 480,
  fillContainer = false,
  touchFriendly = false,
  scalePxPerM = DEFAULT_SCALE_PX_PER_M,
  projection = DEFAULT_PROJECTION_MODE,
  className,
  sessionRef,
  onEngineChange,
  onSelectionChange,
}: RoomDesignerCanvasHostProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const measured = useContainerSize(outerRef);
  const viewportWidth = fillContainer ? measured.width : widthPx;
  const viewportHeight = fillContainer ? measured.height : heightPx;
  const rendererBackend = rendererBackendKey(projection);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootKey, setBootKey] = useState(0);
  const [booting, setBooting] = useState(true);

  const rendererRef = useRef<RoomRenderer | null>(null);
  const sessionRefInternal = useRef<DesignerSession | null>(null);
  if (!sessionRefInternal.current) {
    sessionRefInternal.current = new DesignerSession(initialEngine);
  }
  const [, bump] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (sessionRef) {
      sessionRef.current = sessionRefInternal.current;
    }
  }, [sessionRef]);

  const syncRender = useCallback(() => {
    const renderer = rendererRef.current;
    const session = sessionRefInternal.current;
    if (!renderer || !session) return;
    try {
      renderer.render(session.getDocument(), { scalePxPerM, projection });
    } catch {
      setBootError('تعذّر تحميل مساحة التصميم. أعد المحاولة.');
    }
  }, [projection, scalePxPerM]);

  const handleInteraction = useCallback(
    (event: RendererInteraction) => {
      const session = sessionRefInternal.current;
      const renderer = rendererRef.current;
      if (!session) return;

      if (event.type === 'select') {
        session.setSelection(event.ids);
        onSelectionChange?.(event.ids);
        return;
      }

      try {
        const commands =
          event.command.type === 'BATCH' ? [...event.command.commands] : [event.command];
        const result = session.applyCommands(commands);
        if (result.ok) {
          onEngineChange?.(result.state);
          syncRender();
          bump();
        } else if (renderer) {
          renderer.render(session.getDocument(), { scalePxPerM, projection });
        }
      } catch {
        setBootError('تعذّر تحميل مساحة التصميم. أعد المحاولة.');
      }
    },
    [onEngineChange, onSelectionChange, projection, scalePxPerM, syncRender],
  );

  const lastSessionResetKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!sessionResetKey || lastSessionResetKey.current === sessionResetKey) {
      return;
    }
    lastSessionResetKey.current = sessionResetKey;
    sessionRefInternal.current = new DesignerSession(initialEngine);
    if (sessionRef) {
      sessionRef.current = sessionRefInternal.current;
    }
    syncRender();
    bump();
  }, [initialEngine, sessionRef, sessionResetKey, syncRender]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let cancelled = false;
    setBootError(null);
    setBooting(true);
    void (async () => {
      try {
        const renderer = await createRoomRenderer(projection);
        if (cancelled) {
          renderer.destroy();
          return;
        }
        rendererRef.current = renderer;
        renderer.mount(container, {
          widthPx: viewportWidth,
          heightPx: viewportHeight,
          scalePxPerM,
          touchFriendly,
        });
        renderer.onInteraction(handleInteraction);
        syncRender();
        if (!cancelled) {
          setBooting(false);
        }
      } catch {
        if (!cancelled) {
          setBooting(false);
          setBootError('تعذّر تحميل مساحة التصميم. أعد المحاولة.');
        }
      }
    })();

    return () => {
      cancelled = true;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [bootKey, handleInteraction, projection, rendererBackend, scalePxPerM, syncRender, touchFriendly]);

  useEffect(() => {
    rendererRef.current?.resizeViewport(viewportWidth, viewportHeight);
  }, [viewportHeight, viewportWidth]);

  useEffect(() => {
    syncRender();
  }, [projection, syncRender]);

  return (
    <div
      ref={outerRef}
      className={`relative ${fillContainer ? `h-full w-full ${className ?? ''}` : className ?? ''}`}
    >
      <div
        ref={containerRef}
        className={fillContainer ? 'h-full w-full' : undefined}
        dir="ltr"
        data-testid="room-designer-canvas-host"
        aria-label="Room designer canvas"
      />
      {booting && !bootError ? (
        <div className="absolute inset-0 z-10 overflow-hidden rounded-[inherit]" data-testid="room-designer-canvas-skeleton">
          <ShimmerBone className="h-full w-full rounded-xl" />
        </div>
      ) : null}
      {bootError ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center"
          role="alert"
          data-testid="room-designer-canvas-error"
        >
          <p className="text-sm text-muted-foreground">{bootError}</p>
          <button
            type="button"
            className="min-h-11 rounded-xl border border-border px-4 text-sm"
            onClick={() => {
              setBootError(null);
              setBootKey((key) => key + 1);
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : null}
    </div>
  );
}
