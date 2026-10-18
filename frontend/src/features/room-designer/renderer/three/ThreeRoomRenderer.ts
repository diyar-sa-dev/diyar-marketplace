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

  private textureCache = new Map<string, import('three').Texture>();

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
    const hasBackdrop = Boolean(options.hasBackdrop);
    if (hasBackdrop) {
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
    } else {
      scene.background = new three.Color(0xf6f3ed);
      renderer.setClearColor(0xf6f3ed, 1);
    }
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

    canvas.style.cursor = 'grab';
    this.pointerDownHandler = (ev: PointerEvent) => {
      canvas.style.cursor = 'grabbing';
      this.onPointerDown(ev);
    };
    canvas.addEventListener('pointerdown', this.pointerDownHandler);
    window.addEventListener('pointerup', () => {
      if (!this.disposed && canvas) {
        canvas.style.cursor = 'grab';
      }
    });

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
    this.textureCache.forEach((t) => t.dispose());
    this.textureCache.clear();
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

  panBy(dx: number, dy: number): void {
    if (!this.camera || !this.controls || !this.three) {
      return;
    }
    const right = new this.three.Vector3();
    const up = new this.three.Vector3(0, 1, 0);
    this.camera.getWorldDirection(right);
    right.cross(up).normalize();

    const forward = new this.three.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const panFactor = 0.035;
    const move = right.multiplyScalar(-dx * panFactor).add(forward.multiplyScalar(dy * panFactor));
    this.camera.position.add(move);
    this.controls.target.add(move);
    this.controls.update();
  }

  setHasBackdrop(hasBackdrop: boolean): void {
    if (this.scene && this.renderer && this.three) {
      if (hasBackdrop) {
        this.scene.background = null;
        this.renderer.setClearColor(0x000000, 0);
      } else {
        this.scene.background = new this.three.Color(0xf6f3ed);
        this.renderer.setClearColor(0xf6f3ed, 1);
      }
    }
  }

  setSelection(ids: string[]): void {
    if (!this.three) {
      return;
    }
    const selected = new Set(ids);
    const isRoomSelected = selected.has('__ROOM__');
    if (this.floorMesh?.material && 'emissive' in this.floorMesh.material) {
      const mat = this.floorMesh.material as import('three').MeshStandardMaterial;
      mat.emissive.set(isRoomSelected ? 0x2b1c09 : 0x000000);
    }

    for (const [id, mesh] of this.itemMeshes) {
      const isSelected = selected.has(id);

      // Update Blender-style wireframe color
      const wireframe = mesh.getObjectByName('blender_wireframe') as
        | import('three').LineSegments
        | undefined;
      if (wireframe && wireframe.material instanceof this.three.LineBasicMaterial) {
        wireframe.material.color.set(isSelected ? 0xf59e0b : 0x5a4433);
        wireframe.material.opacity = isSelected ? 1.0 : 0.85;
      }

      // Update mesh materials emissive glow
      mesh.traverse((node) => {
        const m = node as import('three').Mesh;
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const mat of mats) {
            if ('emissive' in mat && mat.emissive instanceof this.three!.Color) {
              mat.emissive.set(isSelected ? 0x332205 : 0x000000);
            }
          }
        }
      });
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
        const isGlbGroup = existing.type === 'Group';
        const yPos = isGlbGroup ? 0 : itemCenterToThreeMeters(item).y;
        existing.position.set(item.position_m.x, yPos, item.position_m.z);
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

  private loadTexture(url: string): import('three').Texture | null {
    if (!this.three || !url) return null;
    const cached = this.textureCache.get(url);
    if (cached) return cached;

    const loader = new this.three.TextureLoader();
    try {
      const texture = loader.load(
        url,
        () => {
          if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
          }
        },
        undefined,
        () => {
          // Texture load error fallback
        },
      );
      texture.colorSpace = this.three.SRGBColorSpace;
      this.textureCache.set(url, texture);
      return texture;
    } catch {
      return null;
    }
  }

  private createBoxMesh(item: RoomDesignItem): ItemMesh {
    const three = this.three!;
    const size = itemSizeToThreeMeters(item);
    const center = itemCenterToThreeMeters(item);
    const geo = new three.BoxGeometry(size.x, size.y, size.z);

    const texture = item.snapshot.thumbnail_url ? this.loadTexture(item.snapshot.thumbnail_url) : null;

    let materials: import('three').Material | import('three').Material[];
    if (texture) {
      const topAndFrontMat = new three.MeshStandardMaterial({
        map: texture,
        roughness: 0.55,
        metalness: 0.05,
        emissive: new three.Color(0x000000),
        color: item.locked ? 0xcccccc : 0xffffff,
      });
      const sideMat = new three.MeshStandardMaterial({
        color: item.locked ? 0x94a3b8 : 0x735942,
        roughness: 0.65,
        metalness: 0.05,
        emissive: new three.Color(0x000000),
      });
      // BoxGeometry faces: 0: +X (right), 1: -X (left), 2: +Y (top), 3: -Y (bottom), 4: +Z (front), 5: -Z (back)
      materials = [sideMat, sideMat, topAndFrontMat, sideMat, topAndFrontMat, sideMat];
    } else {
      materials = new three.MeshStandardMaterial({
        color: item.locked ? 0x94a3b8 : 0x856a52,
        roughness: 0.65,
        metalness: 0.05,
        emissive: new three.Color(0x000000),
      });
    }

    const mesh = new three.Mesh(geo, materials);
    mesh.position.set(center.x, center.y, center.z);
    mesh.rotation.y = itemRotationYRadians(item);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    (mesh as ItemMesh).diyarItemId = item.id;

    // Blender-style EdgesGeometry Wireframe overlay
    const edgesGeo = new three.EdgesGeometry(geo);
    const edgesMat = new three.LineBasicMaterial({
      color: 0x5a4433,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85,
    });
    const wireframe = new three.LineSegments(edgesGeo, edgesMat);
    wireframe.name = 'blender_wireframe';
    mesh.add(wireframe);

    return mesh as ItemMesh;
  }

  private async loadGlbMesh(item: RoomDesignItem, url: string): Promise<ItemMesh> {
    if (!this.three) {
      return this.createBoxMesh(item);
    }
    try {
      const gltfScene = await this.loadGlbGroup(url);
      gltfScene.traverse((child) => {
        const mesh = child as import('three').Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) {
              if ('envMapIntensity' in m) {
                (m as any).envMapIntensity = 1.0;
              }
            }
          }
        }
      });

      // Compute raw bounds of the GLB model
      const rawBox = new this.three.Box3().setFromObject(gltfScene);
      const rawCenter = rawBox.getCenter(new this.three.Vector3());
      const rawSize = rawBox.getSize(new this.three.Vector3());
      const catalog = itemSizeToThreeMeters(item);

      const rootGroup = new this.three.Group();
      (rootGroup as ItemMesh).diyarItemId = item.id;

      // Inner container to normalize pivot to horizontal center and rest on floor (Y=0)
      const innerContainer = new this.three.Group();
      innerContainer.add(gltfScene);
      gltfScene.position.set(-rawCenter.x, -rawBox.min.y, -rawCenter.z);

      if (rawSize.x > 0 && rawSize.y > 0 && rawSize.z > 0) {
        const scaleX = catalog.x / rawSize.x;
        const scaleY = catalog.y / rawSize.y;
        const scaleZ = catalog.z / rawSize.z;
        innerContainer.scale.set(scaleX, scaleY, scaleZ);
      }

      rootGroup.add(innerContainer);

      // Position on floor at item's coordinates
      rootGroup.position.set(item.position_m.x, 0, item.position_m.z);
      rootGroup.rotation.y = itemRotationYRadians(item);

      // Blender-style EdgesGeometry Wireframe bounds for 3D model
      const edgesGeo = new this.three.EdgesGeometry(
        new this.three.BoxGeometry(catalog.x, catalog.y, catalog.z),
      );
      const edgesMat = new this.three.LineBasicMaterial({
        color: 0x5a4433,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.7,
      });
      const wireframe = new this.three.LineSegments(edgesGeo, edgesMat);
      wireframe.name = 'blender_wireframe';
      wireframe.position.set(0, catalog.y / 2, 0);
      rootGroup.add(wireframe);

      return rootGroup as ItemMesh;
    } catch (err) {
      console.warn('[ThreeRoomRenderer] Failed to load GLB model, falling back to box mesh:', err);
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
