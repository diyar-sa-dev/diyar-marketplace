import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LocaleProvider } from '../../../lib/i18n/LocaleProvider.tsx';
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
      <LocaleProvider>
        <QueryClientProvider client={client}>
          <RoomDesignerShell engine={preset.state} />
        </QueryClientProvider>
      </LocaleProvider>,
    );

    expect(screen.getByTestId('room-designer-shell')).toBeInTheDocument();
    expect(screen.getByTestId('room-designer-canvas-host')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /المنتجات/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'إفراغ الغرفة' })).toBeInTheDocument();
    expect(screen.queryByLabelText('معرض المنتجات')).not.toBeInTheDocument();
  });

  it('renders room base model card and opens room layout HUD on click', () => {
    const preset = createSpatialEngineFromPreset('majlis');
    if (preset.ok === false) {
      throw new Error('preset');
    }

    const client = new QueryClient();
    render(
      <LocaleProvider>
        <QueryClientProvider client={client}>
          <RoomDesignerShell engine={preset.state} />
        </QueryClientProvider>
      </LocaleProvider>,
    );

    expect(screen.getByText(/قطع ومخطط الغرفة/i)).toBeInTheDocument();
    const roomCard = screen.getByTitle('تحديد طابع ومجسم الغرفة للتحكم والتنقل');
    expect(roomCard).toBeInTheDocument();
    fireEvent.click(roomCard);

    expect(screen.getByRole('toolbar', { name: 'التحكم بمجسم وطابع الغرفة' })).toBeInTheDocument();
    expect(screen.getByText(/تحريك الغرفة:/i)).toBeInTheDocument();
  });
});
