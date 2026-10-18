/**
 * @vitest-environment jsdom
 */
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DesignerSession } from '../application/DesignerSession.ts';
import { createSpatialEngineFromPreset, executeCommand } from '../application/spatialEngine.ts';
import { makeItem } from '../domain/testFixtures.ts';
import { RoomDesignerCanvasHost } from './RoomDesignerCanvasHost.tsx';

const mockRenderer = {
  mount: vi.fn(),
  destroy: vi.fn(),
  render: vi.fn(),
  resizeViewport: vi.fn(),
  setSelection: vi.fn(),
  onInteraction: vi.fn(),
  panBy: vi.fn(),
};

vi.mock('../renderer/createRoomRenderer.ts', () => ({
  createRoomRenderer: vi.fn(async () => mockRenderer),
}));

beforeEach(() => {
  vi.clearAllMocks();
  class ResizeObserverMock {
    observe = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

describe('RoomDesignerCanvasHost session lifecycle', () => {
  it('preserves session instance and selection across parent engine updates', async () => {
    const preset = createSpatialEngineFromPreset('salon');
    if (preset.ok === false) throw new Error('preset');
    const item = makeItem({ id: 'keep-selection' });
    const withItem = executeCommand(preset.state, { type: 'ADD_ITEM', item });
    if (withItem.ok === false) throw new Error('add item');
    let engine = withItem.state;

    const sessionRef: { current: DesignerSession | null } = { current: null };

    const { rerender } = render(
      <RoomDesignerCanvasHost
        engine={engine}
        sessionResetKey="design-a"
        sessionRef={sessionRef}
        widthPx={400}
        heightPx={300}
      />,
    );

    await waitFor(() => expect(mockRenderer.mount).toHaveBeenCalled());
    const sessionAfterMount = sessionRef.current;
    expect(sessionAfterMount).toBeTruthy();
    sessionAfterMount!.setSelection(['keep-selection']);

    const moved = sessionAfterMount!.applyCommands([
      { type: 'MOVE', itemId: 'keep-selection', position_m: { x: 2, z: 2 } },
    ]);
    expect(moved.ok).toBe(true);
    engine = moved.state;

    rerender(
      <RoomDesignerCanvasHost
        engine={engine}
        sessionResetKey="design-a"
        sessionRef={sessionRef}
        widthPx={400}
        heightPx={300}
      />,
    );

    expect(sessionRef.current).toBe(sessionAfterMount);
    expect(sessionRef.current?.selectedIds).toEqual(['keep-selection']);
  });

  it('does not destroy or remount renderer during local interactions, rotations, or engine updates', async () => {
    const preset = createSpatialEngineFromPreset('salon');
    if (preset.ok === false) throw new Error('preset');
    let engine = preset.state;

    const { rerender } = render(
      <RoomDesignerCanvasHost
        engine={engine}
        sessionResetKey="design-stable"
        onEngineChange={() => {}}
        widthPx={400}
        heightPx={300}
      />,
    );

    await waitFor(() => expect(mockRenderer.mount).toHaveBeenCalledTimes(1));
    expect(mockRenderer.destroy).not.toHaveBeenCalled();

    // Simulate engine update from toolbar rotate/move action with fresh inline callback
    const item = makeItem({ id: 'item-1' });
    const withItem = executeCommand(engine, { type: 'ADD_ITEM', item });
    if (withItem.ok === false) throw new Error('add item');
    engine = withItem.state;

    rerender(
      <RoomDesignerCanvasHost
        engine={engine}
        sessionResetKey="design-stable"
        onEngineChange={() => {}}
        widthPx={400}
        heightPx={300}
      />,
    );

    // Renderer must NOT be destroyed or remounted
    expect(mockRenderer.destroy).not.toHaveBeenCalled();
    expect(mockRenderer.mount).toHaveBeenCalledTimes(1);
    expect(mockRenderer.render).toHaveBeenCalled();
  });

  it('exposes panBy in controlsRef and delegates to renderer.panBy', async () => {
    const preset = createSpatialEngineFromPreset('salon');
    if (preset.ok === false) throw new Error('preset');

    const controlsRef: { current: any } = { current: null };

    render(
      <RoomDesignerCanvasHost
        engine={preset.state}
        controlsRef={controlsRef}
        widthPx={400}
        heightPx={300}
      />,
    );

    await waitFor(() => expect(controlsRef.current).toBeTruthy());
    expect(typeof controlsRef.current.panBy).toBe('function');

    controlsRef.current.panBy(45, -30);
    expect(mockRenderer.panBy).toHaveBeenCalledWith(45, -30);
  });

  it('forwards __ROOM__ selection when isRoomSelected is true', async () => {
    const preset = createSpatialEngineFromPreset('salon');
    if (preset.ok === false) throw new Error('preset');

    const { rerender } = render(
      <RoomDesignerCanvasHost
        engine={preset.state}
        isRoomSelected={false}
        selectedIds={['item-abc']}
        widthPx={400}
        heightPx={300}
      />,
    );

    await waitFor(() => expect(mockRenderer.setSelection).toHaveBeenCalledWith(['item-abc']));

    rerender(
      <RoomDesignerCanvasHost
        engine={preset.state}
        isRoomSelected={true}
        selectedIds={[]}
        widthPx={400}
        heightPx={300}
      />,
    );

    expect(mockRenderer.setSelection).toHaveBeenCalledWith(['__ROOM__']);
  });
});
