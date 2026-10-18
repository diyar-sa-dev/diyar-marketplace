import { ActiveSelection, Canvas, Pattern, Point, Polygon, Rect, type FabricObject, type ModifiedEvent } from 'fabric';
import { resolveItemRenderImageUrl } from '../../adapters/itemDisplayAsset.ts';
import { fabricModifyToCommands } from '../../interaction/fabricModifyToCommands.ts';
import { attachViewportPinchZoom } from './viewportPinchZoom.ts';
import type { RoomDesignDocument, RoomDesignItem } from '../../domain/models.ts';
import { elevationScreenOffsetPx, projectRoomFloorToCanvas, ISO_X, ISO_Y } from '../isometric25d.ts';
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

export class BlenderItemRect extends Rect {
  diyarItemId?: string;
  productImg: HTMLImageElement | null = null;
  isBlenderSelected = false;
  itemName?: string;
  isLockedItem = false;

  override _render(ctx: CanvasRenderingContext2D): void {
    super._render(ctx);

    const w = this.width;
    const h = this.height;

    // 1. Draw Product Image inside bounding box
    if (this.productImg && this.productImg.complete && (this.productImg.naturalWidth > 0 || this.productImg.width > 0)) {
      const pad = 3;
      const maxW = Math.max(1, w - pad * 2);
      const maxH = Math.max(1, h - pad * 2);
      const imgW = this.productImg.naturalWidth || this.productImg.width || 1;
      const imgH = this.productImg.naturalHeight || this.productImg.height || 1;
      const fitScale = Math.min(maxW / imgW, maxH / imgH);
      const drawW = imgW * fitScale;
      const drawH = imgH * fitScale;
      const drawX = -drawW / 2;
      const drawY = -drawH / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      try {
        ctx.drawImage(this.productImg, drawX, drawY, drawW, drawH);
      } catch {
        // Fallback silently if canvas draw throws
      }
      ctx.restore();
    }

    // 2. Blender Corner Vertex Brackets: ⎡ ⎤ ⎣ ⎦
    const bracketLen = Math.max(4, Math.min(10, w / 4, h / 4));
    const strokeCol = this.isLockedItem
      ? '#94a3b8'
      : this.isBlenderSelected
        ? '#f59e0b'
        : '#735942';

    ctx.save();
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = this.isBlenderSelected ? 2.5 : 1.8;
    ctx.lineCap = 'square';

    const halfW = w / 2;
    const halfH = h / 2;

    // Top-Left ⎡
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH + bracketLen);
    ctx.lineTo(-halfW, -halfH);
    ctx.lineTo(-halfW + bracketLen, -halfH);
    ctx.stroke();

    // Top-Right ⎤
    ctx.beginPath();
    ctx.moveTo(halfW - bracketLen, -halfH);
    ctx.lineTo(halfW, -halfH);
    ctx.lineTo(halfW, -halfH + bracketLen);
    ctx.stroke();

    // Bottom-Left ⎣
    ctx.beginPath();
    ctx.moveTo(-halfW, halfH - bracketLen);
    ctx.lineTo(-halfW, halfH);
    ctx.lineTo(-halfW + bracketLen, halfH);
    ctx.stroke();

    // Bottom-Right ⎦
    ctx.beginPath();
    ctx.moveTo(halfW - bracketLen, halfH);
    ctx.lineTo(halfW, halfH);
    ctx.lineTo(halfW, halfH - bracketLen);
    ctx.stroke();

    // 3. Blender Direction Notch / Front Indicator Arrow
    ctx.beginPath();
    ctx.moveTo(-5, -halfH + 6);
    ctx.lineTo(0, -halfH - 2);
    ctx.lineTo(5, -halfH + 6);
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }
}

export class FabricRoomRenderer implements RoomRenderer {
  private canvas: Canvas | null = null;

  private mountOptions: RenderOptions | null = null;

  private interactionHandler: ((event: RendererInteraction) => void) | null = null;

  private itemObjects = new Map<string, BlenderItemRect>();

  private currentDocument: RoomDesignDocument | null = null;

  private currentScale = DEFAULT_SCALE_PX_PER_M;

  private currentProjection: RoomProjectionMode = DEFAULT_PROJECTION_MODE;

  /** Suppress object:modified while applying domain projection. */
  private programmaticSync = false;

  private detachViewportZoom: (() => void) | null = null;

  private mountContainer: HTMLElement | null = null;

  private hasInitialCentered = false;

  private lastCenteredPresetId: string | null = null;

  private isPanning = false;

  private panStartX = 0;

  private panStartY = 0;

  private floorObject: FabricObject | null = null;

  private currentFloorPreset: string | null = null;

  private currentFloorWidth = 0;

  private currentFloorDepth = 0;

  private currentFloorProjection: RoomProjectionMode | null = null;

  private imageCache = new Map<string, HTMLImageElement>();

  private getPointerCoords(e: Event): { x: number; y: number } {
    if ('touches' in e && (e as TouchEvent).touches?.length > 0) {
      const t = (e as TouchEvent).touches[0];
      return { x: t.clientX, y: t.clientY };
    }
    const me = e as MouseEvent;
    return { x: me.clientX ?? 0, y: me.clientY ?? 0 };
  }

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
    this.canvas.on('object:moving', (event) => this.onObjectMoving(event));
    this.canvas.on('object:modified', (event) => this.onObjectModified(event));

    // Smooth drag-and-sweep canvas panning across the studio
    this.canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent | TouchEvent;
      const target = opt.target as TaggedFabricObject | undefined;
      const isItem = Boolean(target?.diyarItemId);
      if (!isItem) {
        this.isPanning = true;
        const coords = this.getPointerCoords(evt);
        this.panStartX = coords.x;
        this.panStartY = coords.y;
        if (this.canvas) {
          this.canvas.defaultCursor = 'grabbing';
        }
      }
    });

    this.canvas.on('mouse:move', (opt) => {
      if (!this.isPanning || !this.canvas) return;
      const evt = opt.e as MouseEvent | TouchEvent;
      const coords = this.getPointerCoords(evt);
      const dx = coords.x - this.panStartX;
      const dy = coords.y - this.panStartY;
      const vpt = this.canvas.viewportTransform;
      if (vpt) {
        vpt[4] += dx;
        vpt[5] += dy;
        this.panStartX = coords.x;
        this.panStartY = coords.y;
        this.canvas.requestRenderAll();
      }
    });

    const stopPan = () => {
      if (this.isPanning && this.canvas) {
        this.isPanning = false;
        this.canvas.defaultCursor = 'default';
      }
    };
    this.canvas.on('mouse:up', stopPan);
  }

  destroy(): void {
    this.detachViewportZoom?.();
    this.detachViewportZoom = null;
    this.isPanning = false;
    this.hasInitialCentered = false;
    this.lastCenteredPresetId = null;
    if (this.canvas) {
      this.canvas.off('object:moving');
      this.canvas.off('object:modified');
      this.canvas.off('mouse:down');
      this.canvas.off('mouse:move');
      this.canvas.off('mouse:up');
    }
    this.itemObjects.clear();
    this.imageCache.clear();
    this.floorObject = null;
    this.currentFloorPreset = null;
    this.currentFloorProjection = null;
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
      const presetId = document.room.preset_id;
      const floorFill =
        this.mountOptions.roomFloorColor ??
        (presetId === 'majlis' ? '#f4ece1' : presetId === 'bedroom' ? '#f8f4ec' : '#f5f0e6');
      const wallColor = this.mountOptions.roomBorderColor ?? '#735942';

      const needsNewFloor =
        !this.floorObject ||
        this.currentFloorProjection !== this.currentProjection ||
        this.currentFloorPreset !== (presetId ?? '') ||
        this.currentFloorWidth !== document.room.width_m ||
        this.currentFloorDepth !== document.room.depth_m;

      if (needsNewFloor) {
        if (this.floorObject) {
          this.canvas.remove(this.floorObject);
          this.floorObject = null;
        }

        if (this.currentProjection === 'isometric_25d') {
          const corners = projectRoomFloorToCanvas(document.room.width_m, document.room.depth_m, scale);
          this.floorObject = new Polygon(
            corners.map((p) => ({ x: p.x, y: p.y })),
            {
              fill: floorFill,
              stroke: wallColor,
              strokeWidth: 3,
              selectable: false,
              evented: false,
            },
          );
        } else {
          this.floorObject = new Rect({
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
        }

        this.canvas.add(this.floorObject);
        this.canvas.sendObjectToBack(this.floorObject);

        this.currentFloorPreset = presetId ?? '';
        this.currentFloorWidth = document.room.width_m;
        this.currentFloorDepth = document.room.depth_m;
        this.currentFloorProjection = this.currentProjection;
      }

      // Reconcile items in-place to prevent flicker and model disappearance
      const currentItemIds = new Set(document.items.map((i) => i.id));
      for (const [id, obj] of this.itemObjects) {
        if (!currentItemIds.has(id)) {
          this.canvas.remove(obj);
          this.itemObjects.delete(id);
        }
      }

      const sorted = [...document.items].sort((a, b) => a.layer - b.layer);
      for (const item of sorted) {
        const existing = this.itemObjects.get(item.id);
        const box = itemFootprintTopLeftPx(
          this.currentProjection,
          item.position_m,
          item.snapshot.width_m,
          item.snapshot.depth_m,
          scale,
        );
        const center = metersToCanvasPoint(
          this.currentProjection,
          item.position_m.x,
          item.position_m.z,
          scale,
        );
        const isoLift =
          this.currentProjection === 'isometric_25d'
            ? elevationScreenOffsetPx(item.snapshot.height_m, scale)
            : 0;

        const w = Math.max(box.widthPx, 4);
        const h = Math.max(box.heightPx, 4);

        if (existing) {
          existing.set({
            left: center.x,
            top: center.y - isoLift,
            width: w,
            height: h,
            angle: item.rotation_deg,
            stroke: item.locked ? '#94a3b8' : (existing.isBlenderSelected ? '#f59e0b' : '#735942'),
            strokeWidth: existing.isBlenderSelected ? 2.2 : 1.5,
            fill: item.locked ? 'rgba(203, 213, 225, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            selectable: true,
            evented: true,
            lockMovementX: item.locked,
            lockMovementY: item.locked,
            lockRotation: item.locked,
            lockScalingX: item.locked,
            lockScalingY: item.locked,
            hasControls: !item.locked,
          });
          existing.isLockedItem = item.locked;
          existing.itemName = item.snapshot.name;
          existing.setCoords();
          if (!existing.productImg && item.snapshot.thumbnail_url) {
            this.loadImageForRect(existing, item.snapshot.thumbnail_url);
          }
        } else {
          this.canvas.add(this.createItemObject(item, scale));
        }
      }

      if (!this.hasInitialCentered || this.lastCenteredPresetId !== (presetId ?? '')) {
        this.hasInitialCentered = true;
        this.lastCenteredPresetId = presetId ?? '';
        this.centerRoomInViewport();
      }

      this.canvas.requestRenderAll();
    } finally {
      this.programmaticSync = false;
    }
  }

  centerRoomInViewport(): void {
    if (!this.canvas || !this.mountOptions || !this.currentDocument) return;
    const w = this.mountOptions.widthPx;
    const h = this.mountOptions.heightPx;
    if (w <= 0 || h <= 0) return;

    const room = this.currentDocument.room;
    const scale = this.currentScale;

    let cx = 0;
    let cy = 0;
    if (this.currentProjection === 'isometric_25d') {
      cx = ((room.width_m - room.depth_m) * ISO_X * scale) / 2;
      cy = ((room.width_m + room.depth_m) * ISO_Y * scale) / 2;
    } else {
      cx = (room.width_m * scale) / 2;
      cy = (room.depth_m * scale) / 2;
    }

    const zoom = this.canvas.getZoom() || 1;
    const panX = w / 2 - cx * zoom;
    const panY = h / 2 - cy * zoom;

    this.canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    this.canvas.requestRenderAll();
  }

  setSelection(ids: string[]): void {
    if (!this.canvas) return;
    this.programmaticSync = true;
    try {
      const selectedSet = new Set(ids);
      for (const [id, itemRect] of this.itemObjects) {
        const isSelected = selectedSet.has(id);
        itemRect.isBlenderSelected = isSelected;
        itemRect.set({
          stroke: itemRect.isLockedItem ? '#94a3b8' : isSelected ? '#f59e0b' : '#735942',
          strokeWidth: isSelected ? 2.2 : 1.5,
          borderColor: isSelected ? '#f59e0b' : '#735942',
          cornerColor: isSelected ? '#f59e0b' : '#ffffff',
          cornerStrokeColor: isSelected ? '#ffffff' : '#735942',
        });
      }

      const isRoomSelected = ids.includes('__ROOM__');
      if (this.floorObject) {
        const defaultWallColor = this.mountOptions?.roomBorderColor ?? '#735942';
        this.floorObject.set({
          stroke: isRoomSelected ? '#f59e0b' : defaultWallColor,
          strokeWidth: isRoomSelected ? 4 : 3,
        });
      }

      const objects = ids
        .filter((id) => id !== '__ROOM__')
        .map((id) => this.itemObjects.get(id))
        .filter((obj): obj is BlenderItemRect => obj != null);
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

  panBy(dx: number, dy: number): void {
    if (!this.canvas) return;
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;
    vpt[4] += dx;
    vpt[5] += dy;
    this.canvas.requestRenderAll();
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
    this.centerRoomInViewport();
  }

  private loadImageForRect(rect: BlenderItemRect, imageUrl: string | undefined): void {
    if (!imageUrl || typeof Image === 'undefined') return;

    const cached = this.imageCache.get(imageUrl);
    if (cached) {
      rect.productImg = cached;
      this.canvas?.requestRenderAll();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.imageCache.set(imageUrl, img);
      rect.productImg = img;
      if (!this.canvas || this.programmaticSync) return;
      this.canvas.requestRenderAll();
    };
    img.onerror = () => {
      // Retry without anonymous crossOrigin to avoid CORS taint blocks on canvas 2D drawImage
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        this.imageCache.set(imageUrl, fallbackImg);
        rect.productImg = fallbackImg;
        if (!this.canvas || this.programmaticSync) return;
        this.canvas.requestRenderAll();
      };
      fallbackImg.src = imageUrl;
    };
    img.src = imageUrl;
  }

  private createItemObject(item: RoomDesignItem, scalePxPerM: number): BlenderItemRect {
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
    const rect = new BlenderItemRect({
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
      selectable: true,
      evented: true,
      lockMovementX: item.locked,
      lockMovementY: item.locked,
      lockRotation: item.locked,
      lockScalingX: item.locked,
      lockScalingY: item.locked,
      hasControls: !item.locked,
      snapAngle: 0,
      snapThreshold: 0,
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
    rect.diyarItemId = item.id;
    rect.itemName = item.snapshot.name;
    rect.isLockedItem = item.locked;
    this.itemObjects.set(item.id, rect);

    if (imageUrl) {
      this.loadImageForRect(rect, imageUrl);
    }

    return rect;
  }

  private onObjectMoving(event: { target?: FabricObject }): void {
    if (this.programmaticSync || !this.currentDocument) {
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

    const hitLeft = rawMeters.x <= halfW + 0.04;
    const hitRight = rawMeters.x >= roomW - halfW - 0.04;
    const hitTop = rawMeters.z <= halfD + 0.04;
    const hitBottom = rawMeters.z >= roomD - halfD - 0.04;
    const isHittingWall = hitLeft || hitRight || hitTop || hitBottom;

    const clampedX = Math.max(halfW, Math.min(roomW - halfW, rawMeters.x));
    const clampedZ = Math.max(halfD, Math.min(roomD - halfD, rawMeters.z));

    const corrected = metersToCanvasPoint(
      this.currentProjection,
      clampedX,
      clampedZ,
      this.currentScale,
    );

    target.set({
      left: corrected.x,
      top: corrected.y - isoLift,
      stroke: isHittingWall ? '#ef4444' : '#735942',
      strokeWidth: isHittingWall ? 2.5 : 1.5,
    });
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
    target.set({
      left: corrected.x,
      top: corrected.y - isoLift,
      stroke: '#735942',
      strokeWidth: 1.5,
    });

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
    const selectedSet = new Set(ids);
    for (const [id, itemRect] of this.itemObjects) {
      const isSelected = selectedSet.has(id);
      itemRect.isBlenderSelected = isSelected;
      itemRect.set({
        stroke: itemRect.isLockedItem ? '#94a3b8' : isSelected ? '#f59e0b' : '#735942',
        strokeWidth: isSelected ? 2.2 : 1.5,
        borderColor: isSelected ? '#f59e0b' : '#735942',
        cornerColor: isSelected ? '#f59e0b' : '#ffffff',
        cornerStrokeColor: isSelected ? '#ffffff' : '#735942',
      });
    }
    this.canvas.requestRenderAll();
    this.interactionHandler({ type: 'select', ids });
  }
}
