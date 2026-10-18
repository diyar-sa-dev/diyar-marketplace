import type { RoomDesignDocument, RoomDesignItem } from '../../domain/models.ts';
import { resolveGlbAssetUrl } from '../../adapters/resolveGlbAssetUrl.ts';
import {
  type RenderOptions,
  type RendererInteraction,
  type RoomRenderer,
  type ViewState,
} from '../types.ts';
import {
  itemCenterToThreeMeters,
  itemRotationYRadians,
  itemSizeToThreeMeters,
  roomCenterMeters,
} from './worldMapping.ts';
import { clearGlbModelCache, getCachedGlbLoad, setCachedGlbLoad } from './glbModelCache.ts';

type ThreeModule = typeof import('three');
type OrbitControlsType = import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
type GLTFLoaderType = import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader;

type ItemMesh = import('three').Object3D & { diyarItemId?: string };

export class ThreeRoomRenderer implements RoomRenderer {
  private container: HTMLElement | null = null;

  private mountOptions: RenderOptions | null = null;

  private interactionHandler: ((event: RendererInteraction) => void) | null = null;

  private currentDocument: RoomDesignDocument | null = null;

  private three: ThreeModule | null = null;

  private renderer: import('three').WebGLRenderer | null = null;

  private scene: import('three').Scene | null = null;

  private camera: import('three').PerspectiveCamera | null = null;

  private controls: OrbitControlsType | null = null;

  private itemMeshes = new Map<string, ItemMesh>();

  private rafId: number | null = null;

  private disposed = false;

  private hasInitiallyFramed = false;

  private lastRoomDimensionsKey = '';

  private floorMesh: import('three').Mesh | null = null;

  private ambientLight: import('three').AmbientLight | null = null;

  private directionalLight: import('three').DirectionalLight | null = null;

  private wallMeshGroup: import('three').Group | null = null;

  private fallbackMessage: HTMLElement | null = null;

  private pointerDownHandler: ((ev: PointerEvent) => void) | null = null;

  mount(container: HTMLElement, options: RenderOptions): void {
    this.destroy();
    this.disposed = false;
    this.container = container;
    container.style.overflow = 'hidden';
    this.mountOptions = options;
    container.replaceChildren();

    void this.initWebGl(options);
  }

  private async initWebGl(options: RenderOptions): Promise<void> {
    if (!this.container || this.disposed) {
      return;
    }

    if (!this.isWebGlAvailable()) {
      this.showFallback('تعذّر تشغيل العرض ثلاثي الأبعاد على هذا الجهاز.');
      return;
    }

    const three = await import('three');
    this.three = three;

    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    this.container.appendChild(canvas);

    const renderer = new three.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(options.widthPx, options.heightPx, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = three.PCFSoftShadowMap;
    renderer.toneMapping = three.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    this.renderer = renderer;

    const scene = new three.Scene();
    scene.background = new three.Color(0xf6f3ed);
    this.scene = scene;

    const camera = new three.PerspectiveCamera(50, options.widthPx / options.heightPx, 0.1, 200);
    camera.position.set(8, 10, 12);
    this.camera = camera;

    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05;
    this.controls = controls;

    this.pointerDownHandler = (ev: PointerEvent) => this.onPointerDown(ev);
    canvas.addEventListener('pointerdown', this.pointerDownHandler);

    this.startLoop();
    if (this.currentDocument) {
      void this.syncScene(this.currentDocument);
    }
  }

  destroy(): void {
    this.disposed = true;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    const canvas = this.renderer?.domElement;
    if (canvas && this.pointerDownHandler) {
      canvas.removeEventListener('pointerdown', this.pointerDownHandler);
    }
    this.pointerDownHandler = null;

    this.controls?.dispose();
    this.controls = null;

    this.disposeSceneObjects();
    if (this.wallMeshGroup) {
      this.scene?.remove(this.wallMeshGroup);
      this.disposeMesh(this.wallMeshGroup);
      this.wallMeshGroup = null;
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.three = null;
    this.floorMesh = null;
    this.ambientLight = null;
    this.directionalLight = null;
    this.hasInitiallyFramed = false;
    this.lastRoomDimensionsKey = '';
    this.itemMeshes.clear();
    this.mountContainerCleanup();
    this.currentDocument = null;
    this.mountOptions = null;
    this.interactionHandler = null;
    clearGlbModelCache();
  }

  private mountContainerCleanup(): void {
    this.fallbackMessage?.remove();
    this.fallbackMessage = null;
    this.container?.replaceChildren();
    this.container = null;
  }

  onInteraction(handler: (event: RendererInteraction) => void): void {
    this.interactionHandler = handler;
  }

  resizeViewport(widthPx: number, heightPx: number): void {
    if (!this.mountOptions) {
      return;
    }
    this.mountOptions = { ...this.mountOptions, widthPx, heightPx };
    if (!this.camera || !this.renderer) {
      return;
    }
    this.camera.aspect = widthPx / heightPx;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(widthPx, heightPx, false);
  }

  render(document: RoomDesignDocument, _view: ViewState): void {
    this.currentDocument = document;
    if (!this.scene || !this.three) {
      return;
    }
    const roomKey = `${document.room.preset_id ?? ''}_${document.room.width_m}_${document.room.depth_m}`;
    const roomChanged = this.lastRoomDimensionsKey !== roomKey;
    this.lastRoomDimensionsKey = roomKey;

    void this.syncScene(document);

    if (!this.hasInitiallyFramed || roomChanged) {
      this.frameCamera(document);
      this.hasInitiallyFramed = true;
    }
  }

  zoomBy(factor: number): void {
    if (!this.camera || !this.controls || !this.three) {
      return;
    }
    const offset = new this.three.Vector3().subVectors(this.camera.position, this.controls.target);
    offset.multiplyScalar(1 / factor);
    const len = offset.length();
    if (len >= 2 && len <= 45) {
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  resetView(): void {
    if (this.currentDocument) {
      this.frameCamera(this.currentDocument);
    }
  }

  rotateView(angleRad: number): void {
    if (!this.camera || !this.controls || !this.three) {
      return;
    }
    const offset = new this.three.Vector3().subVectors(this.camera.position, this.controls.target);
    offset.applyAxisAngle(new this.three.Vector3(0, 1, 0), angleRad);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  setSelection(ids: string[]): void {
    if (!this.three) {
      return;
    }
    const selected = new Set(ids);
    for (const [id, mesh] of this.itemMeshes) {
      const mat = (mesh as import('three').Mesh).material;
      if (mat && 'emissive' in mat && mat.emissive instanceof this.three.Color) {
        mat.emissive.set(selected.has(id) ? 0x335544 : 0x000000);
      }
    }
  }

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) {
        return;
      }
      this.rafId = requestAnimationFrame(tick);
      this.controls?.update();
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    tick();
  }

  private frameCamera(document: RoomDesignDocument): void {
    if (!this.camera || !this.controls) {
      return;
    }
    const center = roomCenterMeters(document.room);
    const span = Math.max(document.room.width_m, document.room.depth_m, 3.5);
    this.controls.target.set(center.x, 0.4, center.z);
    this.camera.position.set(center.x + span * 1.35, span * 1.3, center.z + span * 1.35);
    this.controls.minDistance = 2;
    this.controls.maxDistance = 45;
    this.controls.update();
  }

  private async syncScene(document: RoomDesignDocument): Promise<void> {
    if (!this.scene || !this.three || this.disposed) {
      return;
    }

    // Ensure lighting with realistic shadows
    if (!this.directionalLight) {
      this.directionalLight = new this.three.DirectionalLight(0xfffbf2, 1.3);
      this.directionalLight.position.set(6, 14, 8);
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 1024;
      this.directionalLight.shadow.mapSize.height = 1024;
      this.directionalLight.shadow.bias = -0.0005;
      this.scene.add(this.directionalLight);
    }
    if (!this.ambientLight) {
      this.ambientLight = new this.three.AmbientLight(0xfff8ee, 0.6);
      this.scene.add(this.ambientLight);
    }

    // Ensure floor
    if (!this.floorMesh) {
      this.floorMesh = new this.three.Mesh(
        new this.three.BoxGeometry(document.room.width_m, 0.05, document.room.depth_m),
        new this.three.MeshStandardMaterial({ color: 0xe8dfd0, roughness: 0.75 }),
      );
      this.floorMesh.position.set(document.room.width_m / 2, -0.025, document.room.depth_m / 2);
      this.floorMesh.receiveShadow = true;
      this.scene.add(this.floorMesh);
    } else {
      const geo = this.floorMesh.geometry as import('three').BoxGeometry;
      const params = (geo as unknown as { parameters?: { width?: number; depth?: number } }).parameters;
      if (params?.width !== document.room.width_m || params?.depth !== document.room.depth_m) {
        geo.dispose();
        this.floorMesh.geometry = new this.three.BoxGeometry(document.room.width_m, 0.05, document.room.depth_m);
        this.floorMesh.position.set(document.room.width_m / 2, -0.025, document.room.depth_m / 2);
      }
    }

    // Ensure architectural walls enclosing the 3D room
    if (!this.wallMeshGroup) {
      this.wallMeshGroup = new this.three.Group();
      const wallMat = new this.three.MeshStandardMaterial({
        color: 0xede8df,
        roughness: 0.82,
        metalness: 0.02,
      });
      const wallH = 2.6;
      const wallThick = 0.08;

      // Back wall along Z=0
      const backGeo = new this.three.BoxGeometry(document.room.width_m, wallH, wallThick);
      const backWall = new this.three.Mesh(backGeo, wallMat);
      backWall.position.set(document.room.width_m / 2, wallH / 2, -wallThick / 2);
      backWall.receiveShadow = true;
      backWall.castShadow = true;
      this.wallMeshGroup.add(backWall);

      // Left wall along X=0
      const leftGeo = new this.three.BoxGeometry(wallThick, wallH, document.room.depth_m);
      const leftWall = new this.three.Mesh(leftGeo, wallMat);
      leftWall.position.set(-wallThick / 2, wallH / 2, document.room.depth_m / 2);
      leftWall.receiveShadow = true;
      leftWall.castShadow = true;
      this.wallMeshGroup.add(leftWall);

      this.scene.add(this.wallMeshGroup);
    }

    // Reconcile items
    const docItemIds = new Set(document.items.map((i) => i.id));

    // Remove deleted items
    for (const [id, mesh] of this.itemMeshes) {
      if (!docItemIds.has(id)) {
        this.scene.remove(mesh);
        this.disposeMesh(mesh);
        this.itemMeshes.delete(id);
      }
    }

    // Update existing or add new items
    for (const item of document.items) {
      const existing = this.itemMeshes.get(item.id);
      if (existing) {
        const center = itemCenterToThreeMeters(item);
        existing.position.set(center.x, center.y, center.z);
        existing.rotation.y = itemRotationYRadians(item);
      } else {
        const mesh = await this.createItemMesh(item);
        if (mesh && this.scene && !this.disposed && docItemIds.has(item.id)) {
          this.scene.add(mesh);
          this.itemMeshes.set(item.id, mesh);
        }
      }
    }
  }

  private disposeMesh(obj: import('three').Object3D): void {
    obj.traverse((node) => {
      const mesh = node as import('three').Mesh;
      mesh.geometry?.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
  }

  private async createItemMesh(item: RoomDesignItem): Promise<ItemMesh | null> {
    if (!this.three) {
      return null;
    }
    const glbUrl = resolveGlbAssetUrl(item.snapshot);
    if (glbUrl) {
      return this.loadGlbMesh(item, glbUrl);
    }
    return this.createBoxMesh(item);
  }

  private createBoxMesh(item: RoomDesignItem): ItemMesh {
    const three = this.three!;
    const size = itemSizeToThreeMeters(item);
    const center = itemCenterToThreeMeters(item);
    const mesh = new three.Mesh(
      new three.BoxGeometry(size.x, size.y, size.z),
      new three.MeshStandardMaterial({
        color: item.locked ? 0x94a3b8 : 0x856a52,
        roughness: 0.65,
        metalness: 0.05,
        emissive: new three.Color(0x000000),
      }),
    );
    mesh.position.set(center.x, center.y, center.z);
    mesh.rotation.y = itemRotationYRadians(item);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (mesh as ItemMesh).diyarItemId = item.id;
    return mesh as ItemMesh;
  }

  private async loadGlbMesh(item: RoomDesignItem, url: string): Promise<ItemMesh> {
    if (!this.three) {
      return this.createBoxMesh(item);
    }
    try {
      const clone = await this.loadGlbGroup(url);
      clone.traverse((child) => {
        if ((child as import('three').Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      const box = new this.three.Box3().setFromObject(clone);
      const size = box.getSize(new this.three.Vector3());
      const catalog = itemSizeToThreeMeters(item);
      if (size.x > 0 && size.y > 0 && size.z > 0) {
        clone.scale.set(catalog.x / size.x, catalog.y / size.y, catalog.z / size.z);
      }
      const center = itemCenterToThreeMeters(item);
      clone.position.set(center.x, center.y, center.z);
      clone.rotation.y = itemRotationYRadians(item);
      (clone as ItemMesh).diyarItemId = item.id;
      return clone as ItemMesh;
    } catch {
      return this.createBoxMesh(item);
    }
  }

  private async loadGlbGroup(url: string): Promise<import('three').Group> {
    let pending = getCachedGlbLoad(url);
    if (!pending) {
      pending = (async () => {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const loader: GLTFLoaderType = new GLTFLoader();
        const gltf = await loader.loadAsync(url);
        return gltf.scene;
      })();
      setCachedGlbLoad(url, pending);
    }
    const scene = await pending;
    return scene.clone(true);
  }

  private onPointerDown(ev: PointerEvent): void {
    if (!this.interactionHandler || !this.camera || !this.scene || !this.three || !this.renderer) {
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new this.three.Raycaster();
    raycaster.setFromCamera(new this.three.Vector2(x, y), this.camera);
    const hits = raycaster.intersectObjects([...this.itemMeshes.values()], true);
    const hit = hits.find((h) => this.findItemId(h.object));
    const id = hit ? this.findItemId(hit.object) : null;
    if (id) {
      this.interactionHandler({ type: 'select', ids: [id] });
    } else {
      this.interactionHandler({ type: 'select', ids: [] });
    }
  }

  private findItemId(obj: import('three').Object3D): string | null {
    let current: import('three').Object3D | null = obj;
    while (current) {
      const id = (current as ItemMesh).diyarItemId;
      if (typeof id === 'string') {
        return id;
      }
      current = current.parent;
    }
    return null;
  }

  private disposeSceneObjects(): void {
    if (!this.scene || !this.three) {
      return;
    }
    const toRemove = [...this.scene.children];
    for (const child of toRemove) {
      this.scene.remove(child);
      child.traverse((node) => {
        const mesh = node as import('three').Mesh;
        mesh.geometry?.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    }
    this.itemMeshes.clear();
  }

  private isWebGlAvailable(): boolean {
    try {
      const test = document.createElement('canvas');
      return !!(test.getContext('webgl2') || test.getContext('webgl'));
    } catch {
      return false;
    }
  }

  private showFallback(message: string): void {
    if (!this.container) {
      return;
    }
    this.fallbackMessage = document.createElement('div');
    this.fallbackMessage.setAttribute('role', 'status');
    this.fallbackMessage.dataset.testid = 'room-designer-3d-unavailable';
    this.fallbackMessage.className = 'flex h-full items-center justify-center p-4 text-sm text-muted-foreground';
    this.fallbackMessage.textContent = message;
    this.container.appendChild(this.fallbackMessage);
  }
}
