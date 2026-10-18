import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Boxes,
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
  AlertCircle,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { resolveMediaUrl } from '../../lib/media.ts';

export interface Product3dModelViewerProps {
  modelUrl: string;
  productName: string;
  onClose?: () => void;
  className?: string;
}

export function Product3dModelViewer({
  modelUrl,
  productName,
  onClose,
  className = '',
}: Product3dModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // References for Three.js instances
  const rendererRef = useRef<import('three').WebGLRenderer | null>(null);
  const sceneRef = useRef<import('three').Scene | null>(null);
  const cameraRef = useRef<import('three').PerspectiveCamera | null>(null);
  const controlsRef = useRef<import('three/examples/jsm/controls/OrbitControls.js').OrbitControls | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const initialCameraPosRef = useRef<import('three').Vector3 | null>(null);
  const initialTargetRef = useRef<import('three').Vector3 | null>(null);

  // Validate and resolve safe 3D model URL
  const resolvedUrl = React.useMemo(() => {
    if (!modelUrl) return '';
    const resolved = resolveMediaUrl(modelUrl);
    // Security check: only allow http, https, or relative paths
    if (/^(javascript|data|vbscript):/i.test(resolved)) {
      return '';
    }
    return resolved;
  }, [modelUrl]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => setIsFullscreen((prev) => !prev));
    } else {
      document.exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Initialize Three.js scene & load model
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !resolvedUrl) {
      if (!resolvedUrl) {
        setError('رابط المجسم ثلاثي الأبعاد غير متوفر');
        setLoading(false);
      }
      return;
    }

    let isDisposed = false;
    setLoading(true);
    setLoadProgress(0);
    setError(null);

    let animationFrameId: number;

    void (async () => {
      try {
        const three = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

        if (isDisposed) return;

        const width = container.clientWidth || 500;
        const height = container.clientHeight || 400;

        // Renderer
        const renderer = new three.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = three.PCFSoftShadowMap;
        renderer.toneMapping = three.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.12;
        rendererRef.current = renderer;

        // Scene
        const scene = new three.Scene();
        sceneRef.current = scene;

        // Camera
        const camera = new three.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.set(2.5, 2, 3);
        cameraRef.current = camera;

        // Controls
        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 + 0.05;
        controls.minDistance = 0.3;
        controls.maxDistance = 25;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.5;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new three.AmbientLight(0xfff8ee, 1.1);
        scene.add(ambientLight);

        const keyLight = new three.DirectionalLight(0xffffff, 1.4);
        keyLight.position.set(4, 7, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.bias = -0.0005;
        scene.add(keyLight);

        const fillLight = new three.DirectionalLight(0xebe5df, 0.7);
        fillLight.position.set(-4, 3, -3);
        scene.add(fillLight);

        // Soft circular contact shadow / floor disc
        const floorGeo = new three.CircleGeometry(2.5, 32);
        floorGeo.rotateX(-Math.PI / 2);
        const floorMat = new three.ShadowMaterial({ opacity: 0.18 });
        const floorMesh = new three.Mesh(floorGeo, floorMat);
        floorMesh.position.y = 0;
        floorMesh.receiveShadow = true;
        scene.add(floorMesh);

        // Load 3D Model
        const loader = new GLTFLoader();
        const gltf = await new Promise<import('three/examples/jsm/loaders/GLTFLoader.js').GLTF>((resolve, reject) => {
          loader.load(
            resolvedUrl,
            (loaded) => resolve(loaded),
            (xhr) => {
              if (xhr.total > 0) {
                const pct = Math.round((xhr.loaded / xhr.total) * 100);
                setLoadProgress(pct);
              }
            },
            (err) => reject(err),
          );
        });

        if (isDisposed) return;

        const model = gltf.scene;

        // Enable shadows and sRGB on all meshes
        model.traverse((child) => {
          const mesh = child as import('three').Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              for (const mat of materials) {
                if ('envMapIntensity' in mat) {
                  (mat as import('three').MeshStandardMaterial).envMapIntensity = 1.0;
                }
              }
            }
          }
        });

        // Compute Bounding Box & Normalize Model Placement
        const box = new three.Box3().setFromObject(model);
        const center = box.getCenter(new three.Vector3());
        const size = box.getSize(new three.Vector3());

        // Center horizontally and rest on floor (Y = 0)
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;
        scene.add(model);

        // Adjust floor size to fit product
        const maxHoriz = Math.max(size.x, size.z, 0.8);
        floorMesh.scale.set(maxHoriz * 1.5, maxHoriz * 1.5, 1);

        // Auto-frame camera based on model dimensions
        const maxDim = Math.max(size.x, size.y, size.z, 0.6);
        const fovRad = (camera.fov * Math.PI) / 180;
        const camDistance = (maxDim / 2 / Math.tan(fovRad / 2)) * 1.35;

        const targetY = size.y * 0.45;
        controls.target.set(0, targetY, 0);
        camera.position.set(camDistance * 0.85, targetY + maxDim * 0.45, camDistance * 1.1);
        camera.near = maxDim * 0.05;
        camera.far = maxDim * 40;
        camera.updateProjectionMatrix();
        controls.update();

        // Store initial camera values for reset
        initialCameraPosRef.current = camera.position.clone();
        initialTargetRef.current = controls.target.clone();

        setLoading(false);

        // Animation Loop
        const renderLoop = () => {
          if (isDisposed) return;
          animationFrameId = requestAnimationFrame(renderLoop);
          rafIdRef.current = animationFrameId;

          controls.update();
          renderer.render(scene, camera);
        };
        renderLoop();

        // Responsive Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
          if (isDisposed || !entries[0]) return;
          const { width: newW, height: newH } = entries[0].contentRect;
          if (newW > 0 && newH > 0) {
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH, false);
          }
        });
        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
        };
      } catch (err) {
        if (!isDisposed) {
          setLoading(false);
          setError('تعذّر تحميل النموذج ثلاثي الأبعاد. يرجى التحقق من اتصالك والمحاولة مجدداً.');
        }
      }
    })();

    return () => {
      isDisposed = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      controlsRef.current?.dispose();
      rendererRef.current?.dispose();

      // Clean up meshes and textures
      if (sceneRef.current) {
        sceneRef.current.traverse((child) => {
          const mesh = child as import('three').Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose();
          }
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of mats) {
              mat.dispose();
            }
          }
        });
      }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, [resolvedUrl, retryKey]);

  // Sync autoRotate state with OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current && initialCameraPosRef.current && initialTargetRef.current) {
      cameraRef.current.position.copy(initialCameraPosRef.current);
      controlsRef.current.target.copy(initialTargetRef.current);
      controlsRef.current.update();
    }
  };

  const handleZoom = (factor: number) => {
    if (cameraRef.current && controlsRef.current) {
      const offset = cameraRef.current.position.clone().sub(controlsRef.current.target);
      offset.multiplyScalar(factor);
      cameraRef.current.position.copy(controlsRef.current.target).add(offset);
      controlsRef.current.update();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative isolate overflow-hidden rounded-3xl bg-radial from-[#fdfbf7] to-[#ede7dc] border border-diyar-brown/20 shadow-sm ${
        isFullscreen ? 'fixed inset-0 z-100 rounded-none h-screen w-screen' : 'h-full w-full'
      } ${className}`}
      dir="rtl"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full block touch-none cursor-grab active:cursor-grabbing"
      />

      {/* Top Header Overlay */}
      <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-diyar-brown/20 shadow-xs pointer-events-auto">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
            <Boxes size={14} />
          </div>
          <span className="text-xs font-black text-diyar-dark truncate max-w-[150px] sm:max-w-[220px]">
            {productName}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            3D تفاعلي
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-diyar-dark border border-diyar-brown/20 shadow-xs hover:bg-white hover:text-diyar-brown transition"
            title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
            aria-label="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 px-2.5 items-center gap-1 rounded-full bg-white/90 text-diyar-dark border border-diyar-brown/20 shadow-xs hover:bg-white hover:text-diyar-brown text-xs font-bold transition"
              title="العودة لمعرض الصور"
            >
              <Camera size={13} />
              <span>الصور</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Interactive Floating Control Toolbar at Bottom */}
      {!loading && !error ? (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-1 rounded-2xl border border-diyar-brown/20 shadow-md">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`flex h-7 px-2 items-center gap-1 rounded-xl text-xs font-bold transition ${
              autoRotate
                ? 'bg-diyar-brown text-white shadow-2xs'
                : 'text-diyar-dark hover:bg-diyar-cream/60'
            }`}
            title="تدوير تلقائي 360°"
          >
            <RotateCw size={13} className={autoRotate ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">دوران 360°</span>
          </button>

          <div className="h-4 w-px bg-diyar-brown/20 mx-0.5" />

          <button
            type="button"
            onClick={() => handleZoom(0.85)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream/60 transition"
            title="تكبير (Zoom In)"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            onClick={() => handleZoom(1.18)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-diyar-dark hover:bg-diyar-cream/60 transition"
            title="تصغير (Zoom Out)"
          >
            <ZoomOut size={14} />
          </button>

          <div className="h-4 w-px bg-diyar-brown/20 mx-0.5" />

          <button
            type="button"
            onClick={handleResetView}
            className="flex h-7 px-2 items-center gap-1 rounded-lg text-xs font-bold text-diyar-dark hover:bg-diyar-cream/60 transition"
            title="إعادة ضبط زاوية الرؤية"
          >
            <RefreshCw size={12} />
            <span>إعادة ضبط</span>
          </button>
        </div>
      ) : null}

      {/* Loading Skeleton / Progress Overlay */}
      {loading ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#fdfbf7]/85 backdrop-blur-xs p-6 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-[#735942] text-white shadow-md animate-pulse">
            <Boxes size={28} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-diyar-dark">جاري تحميل المجسم ثلاثي الأبعاد…</p>
            {loadProgress > 0 ? (
              <p className="text-xs text-muted-foreground font-semibold tabular-nums">
                {loadProgress}%
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">تحضير المحرك الواقعي</p>
            )}
          </div>
          {loadProgress > 0 ? (
            <div className="w-36 h-1.5 rounded-full bg-diyar-cream/80 overflow-hidden border border-diyar-brown/20">
              <div
                className="h-full bg-diyar-brown transition-all duration-300 rounded-full"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Error Overlay */}
      {error ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#fdfbf7]/95 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200">
            <AlertCircle size={22} />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">{error}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-diyar-brown/30 bg-white px-3 text-xs font-bold text-diyar-dark hover:bg-diyar-cream/40 transition cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>إعادة المحاولة</span>
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-9 items-center rounded-xl bg-diyar-dark px-3 text-xs font-bold text-white hover:bg-black transition cursor-pointer"
              >
                العودة للصور
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
