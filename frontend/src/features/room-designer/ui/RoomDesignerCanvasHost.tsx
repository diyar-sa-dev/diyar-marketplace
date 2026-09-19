import { useCallback, useEffect, useReducer, useRef, type MutableRefObject } from 'react';
import { DesignerSession } from '../application/DesignerSession.ts';
import type { SpatialEngineState } from '../application/spatialEngine.ts';
import type { RendererInteraction } from '../renderer/types.ts';
import { DEFAULT_SCALE_PX_PER_M } from '../renderer/types.ts';
import { createRoomRenderer } from '../renderer/createRoomRenderer.ts';
import type { RoomRenderer } from '../renderer/types.ts';
import { useContainerSize } from './useContainerSize.ts';

export type RoomDesignerCanvasHostProps = {
  engine: SpatialEngineState;
  /** Reset session when loading a different persisted design (not on every local edit). */
  sessionResetKey?: string;
  widthPx?: number;
  heightPx?: number;
  fillContainer?: boolean;
  touchFriendly?: boolean;
  scalePxPerM?: number;
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
    renderer.render(session.getDocument(), { scalePxPerM });
  }, [scalePxPerM]);

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

      const commands =
        event.command.type === 'BATCH' ? [...event.command.commands] : [event.command];
      const result = session.applyCommands(commands);
      if (result.ok) {
        onEngineChange?.(result.state);
        syncRender();
        bump();
      } else if (renderer) {
        renderer.render(session.getDocument(), { scalePxPerM });
      }
    },
    [onEngineChange, onSelectionChange, scalePxPerM, syncRender],
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
    void (async () => {
      const renderer = await createRoomRenderer();
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
    })();

    return () => {
      cancelled = true;
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once; resize via resizeViewport
  }, [handleInteraction, scalePxPerM, syncRender, touchFriendly]);

  useEffect(() => {
    rendererRef.current?.resizeViewport(viewportWidth, viewportHeight);
  }, [viewportHeight, viewportWidth]);

  return (
    <div ref={outerRef} className={fillContainer ? `h-full w-full ${className ?? ''}` : className}>
      <div
        ref={containerRef}
        className={fillContainer ? 'h-full w-full' : undefined}
        dir="ltr"
        data-testid="room-designer-canvas-host"
        aria-label="Room designer canvas"
      />
    </div>
  );
}
