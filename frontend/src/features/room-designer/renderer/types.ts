import type { RoomCommand } from '../domain/commands/types.ts';
import type { RoomDesignDocument } from '../domain/models.ts';

export interface ViewState {
  scalePxPerM: number;
}

export interface RenderOptions {
  /** Canvas element size (viewport). */
  widthPx: number;
  heightPx: number;
  scalePxPerM?: number;
  roomFloorColor?: string;
  roomBorderColor?: string;
  /** Larger Fabric controls for touch (Stage 30.9). */
  touchFriendly?: boolean;
}

export type RendererInteraction =
  | { type: 'select'; ids: string[] }
  | { type: 'command'; command: RoomCommand; pointer_m?: { x: number; z: number } };

export interface RoomRenderer {
  mount(container: HTMLElement, options: RenderOptions): void;
  destroy(): void;
  /** Update viewport pixels without remounting (orientation / responsive layout). */
  resizeViewport(widthPx: number, heightPx: number): void;
  render(document: RoomDesignDocument, view: ViewState): void;
  setSelection(ids: string[]): void;
  onInteraction(handler: (event: RendererInteraction) => void): void;
}

export const DEFAULT_SCALE_PX_PER_M = 80;
