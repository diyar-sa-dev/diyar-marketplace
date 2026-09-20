import { afterEach, describe, expect, it, vi } from 'vitest';

describe('roomDesignerFeatures', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('25d is disabled unless env is exactly true', async () => {
    vi.stubEnv('VITE_ROOM_DESIGNER_25D_ENABLED', 'false');
    const { isRoomDesigner25dEnabled: off } = await import('./roomDesignerFeatures.ts');
    expect(off()).toBe(false);

    vi.stubEnv('VITE_ROOM_DESIGNER_25D_ENABLED', 'true');
    vi.resetModules();
    const { isRoomDesigner25dEnabled: on } = await import('./roomDesignerFeatures.ts');
    expect(on()).toBe(true);
  });

  it('ai spatial is disabled unless env is exactly true', async () => {
    vi.stubEnv('VITE_ROOM_DESIGNER_AI_SPATIAL_ENABLED', 'false');
    const { isRoomDesignerAiSpatialEnabled: off } = await import('./roomDesignerFeatures.ts');
    expect(off()).toBe(false);

    vi.stubEnv('VITE_ROOM_DESIGNER_AI_SPATIAL_ENABLED', 'true');
    vi.resetModules();
    const { isRoomDesignerAiSpatialEnabled: on } = await import('./roomDesignerFeatures.ts');
    expect(on()).toBe(true);
  });

  it('3d is disabled unless env is exactly true', async () => {
    vi.stubEnv('VITE_ROOM_DESIGNER_3D_ENABLED', 'false');
    const { isRoomDesigner3dEnabled: off } = await import('./roomDesignerFeatures.ts');
    expect(off()).toBe(false);

    vi.stubEnv('VITE_ROOM_DESIGNER_3D_ENABLED', 'true');
    vi.resetModules();
    const { isRoomDesigner3dEnabled: on } = await import('./roomDesignerFeatures.ts');
    expect(on()).toBe(true);
  });
});
