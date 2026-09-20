import type { RoomProjectionMode } from './projectionMode.ts';
import { DEFAULT_PROJECTION_MODE, usesThreeRenderer } from './projectionMode.ts';
import type { RoomRenderer } from './types.ts';

/** Lazy-load Fabric or Three adapter — keeps heavy deps out of the main bundle until needed. */
export async function createRoomRenderer(
  projection: RoomProjectionMode = DEFAULT_PROJECTION_MODE,
): Promise<RoomRenderer> {
  if (usesThreeRenderer(projection)) {
    const { ThreeRoomRenderer } = await import('./three/ThreeRoomRenderer.ts');
    return new ThreeRoomRenderer();
  }
  const { FabricRoomRenderer } = await import('./fabric/FabricRoomRenderer.ts');
  return new FabricRoomRenderer();
}
