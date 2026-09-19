import type { RoomRenderer } from './types.ts';

/** Lazy-load Fabric adapter — keeps `fabric` out of the main bundle until designer opens. */
export async function createRoomRenderer(): Promise<RoomRenderer> {
  const { FabricRoomRenderer } = await import('./fabric/FabricRoomRenderer.ts');
  return new FabricRoomRenderer();
}
