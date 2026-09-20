import { ActiveSelection, Canvas, Polygon, Rect, type FabricObject, type ModifiedEvent } from 'fabric';
import { resolveItemRenderImageUrl } from '../../adapters/itemDisplayAsset.ts';
import { fabricModifyToCommands } from '../../interaction/fabricModifyToCommands.ts';
import { attachViewportPinchZoom } from './viewportPinchZoom.ts';
import type { RoomDesignDocument, RoomDesignItem } from '../../domain/models.ts';
import { elevationScreenOffsetPx, projectRoomFloorToCanvas } from '../isometric25d.ts';
import {
  DEFAULT_PROJECTION_MODE,
  itemFootprintTopLeftPx,
  metersToCanvasPoint,
  type RoomProjectionMode,
} from '../projectionMode.ts';
import {
  DEFAULT_SCALE_PX_PER_M,
  type RenderOptions,
  type RendererInteraction,
  type RoomRenderer,
  type ViewState,
} from '../types.ts';

type TaggedFabricObject = FabricObject & { diyarItemId?: string };

export class FabricRoomRenderer implements RoomRenderer {
  private canvas: Canvas | null = null;

  private mountOptions: RenderOptions | null = null;

  private interactionHandler: ((event: RendererInteraction) => void) | null = null;

  private itemObjects = new Map<string, FabricObject>();

  private currentDocument: RoomDesignDocument | null = null;

  private currentScale = DEFAULT_SCALE_PX_PER_M;

  private currentProjection: RoomProjectionMode = DEFAULT_PROJECTION_MODE;

  /** Suppress object:modified while applying domain projection. */
  private programmaticSync = false;

  private detachViewportZoom: (() => void) | null = null;

  private mountContainer: HTMLElement | null = null;

  mount(container: HTMLElement, options: RenderOptions): void {
    this.destroy();
    this.mountContainer = container;
    this.mountOptions = options;
    const canvasEl = document.createElement('canvas');
    container.replaceChildren(canvasEl);
    container.style.touchAction = 'none';
    this.canvas = new Canvas(canvasEl, {
      width: options.widthPx,
      height: options.heightPx,
      selection: true,
      allowTouchScrolling: false,
    });
    this.detachViewportZoom = attachViewportPinchZoom(this.canvas, container);
    this.canvas.on('selection:created', () => this.emitSelection());
    this.canvas.on('selection:updated', () => this.emitSelection());
    this.canvas.on('selection:cleared', () => this.emitSelection());
    this.canvas.on('object:modified', (event) => this.onObjectModified(event));
  }

  destroy(): void {
    this.detachViewportZoom?.();
    this.detachViewportZoom = null;
    if (this.canvas) {
      this.canvas.off('object:modified');
    }
    this.itemObjects.clear();
    this.currentDocument = null;
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.mountContainer?.replaceChildren();
    this.mountContainer = null;
    this.mountOptions = null;
  }

  onInteraction(handler: (event: RendererInteraction) => void): void {
    this.interactionHandler = handler;
  }

  resizeViewport(widthPx: number, heightPx: number): void {
    if (!this.canvas || !this.mountOptions) {
      return;
    }
    this.mountOptions = { ...this.mountOptions, widthPx, heightPx };
    this.canvas.setDimensions({ width: widthPx, height: heightPx });
    if (this.currentDocument) {
      this.render(this.currentDocument, {
        scalePxPerM: this.currentScale,
        projection: this.currentProjection,
      });
    }
  }

  render(document: RoomDesignDocument, view: ViewState): void {
    if (!this.canvas || !this.mountOptions) {
      return;
    }

    const scale = view.scalePxPerM || this.mountOptions.scalePxPerM || DEFAULT_SCALE_PX_PER_M;
    this.currentScale = scale;
    this.currentProjection = view.projection ?? DEFAULT_PROJECTION_MODE;
    this.currentDocument = document;

    this.programmaticSync = true;
    try {
      this.canvas.clear();
      this.itemObjects.clear();

      const floorFill = this.mountOptions.roomFloorColor ?? '#f3ecdb';
      const floorStroke = this.mountOptions.roomBorderColor ?? '#947961';
      if (this.currentProjection === 'isometric_25d') {
        const corners = projectRoomFloorToCanvas(document.room.width_m, document.room.depth_m, scale);
        const floor = new Polygon(
          corners.map((p) => ({ x: p.x, y: p.y })),
          {
            fill: floorFill,
            stroke: floorStroke,
            strokeWidth: 2,
            selectable: false,
            evented: false,
          },
        );
        this.canvas.add(floor);
      } else {
        const floor = new Rect({
          left: 0,
          top: 0,
          width: document.room.width_m * scale,
          height: document.room.depth_m * scale,
          fill: floorFill,
          stroke: floorStroke,
          strokeWidth: 2,
          selectable: false,
          evented: false,
        });
        this.canvas.add(floor);
      }

      const sorted = [...document.items].sort((a, b) => a.layer - b.layer);
      for (const item of sorted) {
        this.canvas.add(this.createItemObject(item, scale));
      }

      this.canvas.requestRenderAll();
    } finally {
      this.programmaticSync = false;
    }
  }

  setSelection(ids: string[]): void {
    if (!this.canvas) return;
    this.programmaticSync = true;
    try {
      const objects = ids
        .map((id) => this.itemObjects.get(id))
        .filter((obj): obj is FabricObject => obj != null);
      if (objects.length === 0) {
        this.canvas.discardActiveObject();
      } else if (objects.length === 1) {
        this.canvas.setActiveObject(objects[0]);
      } else {
        this.canvas.setActiveObject(new ActiveSelection(objects, { canvas: this.canvas }));
      }
      this.canvas.requestRenderAll();
    } finally {
      this.programmaticSync = false;
    }
  }

  private createItemObject(item: RoomDesignItem, scalePxPerM: number): Rect {
    const box = itemFootprintTopLeftPx(
      this.currentProjection,
      item.position_m,
      item.snapshot.width_m,
      item.snapshot.depth_m,
      scalePxPerM,
    );
    const center = metersToCanvasPoint(
      this.currentProjection,
      item.position_m.x,
      item.position_m.z,
      scalePxPerM,
    );
    const touch = this.mountOptions?.touchFriendly ?? false;
    const isoLift =
      this.currentProjection === 'isometric_25d'
        ? elevationScreenOffsetPx(item.snapshot.height_m, scalePxPerM)
        : 0;
    const hasTierImage = resolveItemRenderImageUrl(item.snapshot, this.currentProjection) != null;
    const rect = new Rect({
      left: center.x,
      top: center.y - isoLift,
      width: Math.max(box.widthPx, 4),
      height: Math.max(box.heightPx, 4),
      angle: item.rotation_deg,
      originX: 'center',
      originY: 'center',
      fill: item.locked ? '#cbd5e1' : hasTierImage ? '#e8dfd0' : '#947961',
      opacity: 0.85,
      stroke: '#1f3d3a',
      strokeWidth: 1,
      selectable: !item.locked,
      evented: !item.locked,
      centeredRotation: true,
      cornerSize: touch ? 14 : 8,
      touchCornerSize: touch ? 28 : 12,
      padding: touch ? 6 : 2,
    });
    (rect as TaggedFabricObject).diyarItemId = item.id;
    this.itemObjects.set(item.id, rect);
    return rect;
  }

  private onObjectModified(event: ModifiedEvent): void {
    if (this.programmaticSync || !this.interactionHandler || !this.currentDocument) {
      return;
    }
    const target = event.target as TaggedFabricObject | undefined;
    const itemId = target?.diyarItemId;
    if (!itemId || !target) {
      return;
    }
    const item = this.currentDocument.items.find((i) => i.id === itemId);
    if (!item || item.locked) {
      return;
    }

    const isoLift =
      this.currentProjection === 'isometric_25d'
        ? elevationScreenOffsetPx(item.snapshot.height_m, this.currentScale)
        : 0;
    const commands = fabricModifyToCommands(
      item,
      { x: target.left ?? 0, y: (target.top ?? 0) + isoLift },
      target.angle ?? 0,
      this.currentScale,
      this.currentProjection,
    );
    if (commands.length === 0) {
      return;
    }

    const batch =
      commands.length === 1 ? commands[0] : { type: 'BATCH' as const, commands: [...commands] };
    this.interactionHandler({ type: 'command', command: batch });
  }

  private emitSelection(): void {
    if (this.programmaticSync || !this.canvas || !this.interactionHandler) return;
    const active = this.canvas.getActiveObjects();
    const ids = active
      .map((obj) => (obj as TaggedFabricObject).diyarItemId)
      .filter((id): id is string => typeof id === 'string');
    this.interactionHandler({ type: 'select', ids });
  }
}
