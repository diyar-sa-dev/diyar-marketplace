import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createSpatialEngineFromPreset } from '../application/spatialEngine.ts';
import { RoomDesignerShell } from './RoomDesignerShell.tsx';

vi.mock('./RoomDesignerCanvasHost.tsx', () => ({
  RoomDesignerCanvasHost: () => <div data-testid="room-designer-canvas-host" />,
}));

vi.mock('./useLargeScreen.ts', () => ({
  useLargeScreen: () => false,
}));

describe('RoomDesignerShell mobile layout', () => {
  it('shows catalog sheet trigger and canvas on narrow viewport', () => {
    const preset = createSpatialEngineFromPreset('majlis');
    if (preset.ok === false) {
      throw new Error('preset');
    }

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <RoomDesignerShell engine={preset.state} />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('room-designer-shell')).toBeInTheDocument();
    expect(screen.getByTestId('room-designer-canvas-host')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /المنتجات/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('معرض المنتجات')).not.toBeInTheDocument();
  });
});
