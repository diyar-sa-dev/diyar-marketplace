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
};

vi.mock('../renderer/createRoomRenderer.ts', () => ({
  createRoomRenderer: vi.fn(async () => mockRenderer),
}));

beforeEach(() => {
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
});
