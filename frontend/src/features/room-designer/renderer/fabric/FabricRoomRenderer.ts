import { ActiveSelection, Canvas, Pattern, Point, Polygon, Rect, type FabricObject, type ModifiedEvent } from 'fabric';
import { resolveItemRenderImageUrl } from '../../adapters/itemDisplayAsset.ts';
import { fabricModifyToCommands } from '../../interaction/fabricModifyToCommands.ts';
import { attachViewportPinchZoom } from './viewportPinchZoom.ts';
import type { RoomDesignDocument, RoomDesignItem } from '../../domain/models.ts';
import { elevationScreenOffsetPx, projectRoomFloorToCanvas } from '../isometric25d.ts';
import {
  DEFAULT_PROJECTION_MODE,
  canvasPointToMeters,
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
      backgroundColor: '#faf8f5',
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

      const presetId = document.room.preset_id;
      const floorFill =
        this.mountOptions.roomFloorColor ??
        (presetId === 'majlis' ? '#f4ece1' : presetId === 'bedroom' ? '#f8f4ec' : '#f5f0e6');
      const wallColor = this.mountOptions.roomBorderColor ?? '#735942';

      if (this.currentProjection === 'isometric_25d') {
        const corners = projectRoomFloorToCanvas(document.room.width_m, document.room.depth_m, scale);
        const floor = new Polygon(
          corners.map((p) => ({ x: p.x, y: p.y })),
          {
            fill: floorFill,
            stroke: wallColor,
            strokeWidth: 3,
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
          stroke: wallColor,
          strokeWidth: 3,
          rx: 2,
          ry: 2,
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

  zoomBy(factor: number): void {
    if (!this.canvas) return;
    const center = this.canvas.getCenter();
    const current = this.canvas.getZoom();
    const next = Math.min(4, Math.max(0.4, current * factor));
    this.canvas.zoomToPoint(new Point(center.left, center.top), next);
    this.canvas.requestRenderAll();
  }

  resetView(): void {
    if (!this.canvas) return;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.canvas.requestRenderAll();
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
    const imageUrl = item.snapshot.thumbnail_url;

    // Blender-style transparent bounding rectangle with corner vertex handles
    const rect = new Rect({
      left: center.x,
      top: center.y - isoLift,
      width: Math.max(box.widthPx, 4),
      height: Math.max(box.heightPx, 4),
      angle: item.rotation_deg,
      originX: 'center',
      originY: 'center',
      fill: item.locked ? 'rgba(203, 213, 225, 0.35)' : 'rgba(255, 255, 255, 0.08)',
      stroke: item.locked ? '#94a3b8' : '#735942',
      strokeWidth: 1.5,
      strokeDashArray: [4, 3],
      selectable: !item.locked,
      evented: !item.locked,
      centeredRotation: true,
      transparentCorners: false,
      cornerStyle: 'circle',
      cornerColor: '#ffffff',
      cornerStrokeColor: '#735942',
      cornerSize: touch ? 12 : 7,
      touchCornerSize: touch ? 26 : 12,
      borderColor: '#735942',
      borderScaleFactor: 1.5,
      padding: touch ? 6 : 2,
    });
    (rect as TaggedFabricObject).diyarItemId = item.id;
    this.itemObjects.set(item.id, rect);

    // Render product image inside the transparent Blender-style box
    if (imageUrl && typeof Image !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!this.canvas || this.programmaticSync) return;
        try {
          const w = Math.max(box.widthPx, 4);
          const h = Math.max(box.heightPx, 4);
          const imgW = img.width || 1;
          const imgH = img.height || 1;
          const fitScale = Math.min((w * 0.88) / imgW, (h * 0.88) / imgH);
          const pattern = new Pattern({
            source: img,
            repeat: 'no-repeat',
            patternTransform: [
              fitScale,
              0,
              0,
              fitScale,
              (w - imgW * fitScale) / 2,
              (h - imgH * fitScale) / 2,
            ],
          });
          rect.set('fill', pattern);
          this.canvas?.requestRenderAll();
        } catch {
          // Keep transparent Blender-style box on error
        }
      };
      img.src = imageUrl;
    }

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

    // Gracefully clamp coordinates so the model can be placed smoothly anywhere inside the room
    const roomW = this.currentDocument.room.width_m;
    const roomD = this.currentDocument.room.depth_m;
    const halfW = (item.snapshot.width_m || 0.8) / 2;
    const halfD = (item.snapshot.depth_m || 0.8) / 2;

    const rawMeters = canvasPointToMeters(
      this.currentProjection,
      target.left ?? 0,
      (target.top ?? 0) + isoLift,
      this.currentScale,
    );
    const clampedX = Math.max(halfW, Math.min(roomW - halfW, rawMeters.x));
    const clampedZ = Math.max(halfD, Math.min(roomD - halfD, rawMeters.z));

    const corrected = metersToCanvasPoint(
      this.currentProjection,
      clampedX,
      clampedZ,
      this.currentScale,
    );
    target.set({ left: corrected.x, top: corrected.y - isoLift });

    const commands = fabricModifyToCommands(
      item,
      { x: corrected.x, y: corrected.y },
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
