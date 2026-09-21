import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseApiError } from '../../../utils/errors.ts';
import {
  createSpatialEngineFromDocument,
  createSpatialEngineFromPreset,
} from '../application/spatialEngine.ts';
import { useCreateRoomDesignMutation, useRoomDesignQuery } from '../persistence/useRoomDesignQuery.ts';
import { RoomDesignerShell } from './RoomDesignerShell.tsx';
import { RoomDesignerWorkspaceSkeleton } from './RoomDesignerWorkspaceSkeleton.tsx';

export type RoomDesignerWorkspaceProps = {
  designIdFromRoute?: string;
  onCreated?: (id: string) => void;
};

export function RoomDesignerWorkspace({
  designIdFromRoute,
  onCreated,
}: RoomDesignerWorkspaceProps) {
  const [designId, setDesignId] = useState(designIdFromRoute);
  const createStarted = useRef(false);
  const onCreatedRef = useRef(onCreated);
  onCreatedRef.current = onCreated;
  const { data, isLoading, isError, error, refetch } = useRoomDesignQuery(designId, Boolean(designId));
  const createMutation = useCreateRoomDesignMutation();
  const createDesign = createMutation.mutate;
  const resetCreate = createMutation.reset;

  const draftEngine = useMemo(() => {
    if (designIdFromRoute) {
      return null;
    }
    try {
      const preset = createSpatialEngineFromPreset('majlis');
      return preset.ok ? preset.state : null;
    } catch {
      return null;
    }
  }, [designIdFromRoute]);

  useEffect(() => {
    if (designIdFromRoute && designIdFromRoute !== designId) {
      setDesignId(designIdFromRoute);
    }
  }, [designId, designIdFromRoute]);

  useEffect(() => {
    if (designIdFromRoute || designId || createStarted.current) {
      return;
    }
    if (!draftEngine) {
      return;
    }
    createStarted.current = true;
    createDesign(
      { title: null, document: draftEngine.document },
      {
        onSuccess: (record) => {
          setDesignId(record.id);
          onCreatedRef.current?.(record.id);
        },
        onError: () => {
          createStarted.current = false;
        },
      },
    );
  }, [createDesign, designId, designIdFromRoute, draftEngine]);

  const loadedEngine = useMemo(() => {
    if (!data?.document) {
      return null;
    }
    try {
      return createSpatialEngineFromDocument(data.document);
    } catch {
      return null;
    }
  }, [data?.document]);

  if (!designIdFromRoute && draftEngine) {
    return (
      <div className="flex min-h-0 flex-col gap-2">
        {createMutation.isError ? (
          <div className="px-1 text-center" data-testid="room-designer-page-error" role="alert">
            <p className="text-sm text-muted-foreground">
              {parseApiError(createMutation.error).status === 403
                ? 'مصمّم الغرف غير متاح حالياً.'
                : parseApiError(createMutation.error).message || 'تعذّر حفظ التصميم.'}
            </p>
            <button
              type="button"
              className="mt-2 text-sm text-diyar-brown underline"
              onClick={() => {
                createStarted.current = false;
                resetCreate();
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : null}
        <RoomDesignerShell
          engine={draftEngine}
          designId={designId}
          designVersion={data?.version}
          sessionResetKey="draft"
        />
      </div>
    );
  }

  if (createMutation.isError && !designId) {
    const parsed = parseApiError(createMutation.error);
    return (
      <div className="mx-auto max-w-lg p-6 text-center" data-testid="room-designer-page-error">
        <p className="text-sm text-muted-foreground">
          {parsed.status === 403
            ? 'مصمّم الغرف غير متاح حالياً.'
            : parsed.message || 'تعذّر إنشاء التصميم.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="text-sm text-diyar-brown underline"
            onClick={() => {
              createStarted.current = false;
              resetCreate();
            }}
          >
            إعادة المحاولة
          </button>
          <Link to="/profile" className="text-sm text-primary underline">
            العودة للملف الشخصي
          </Link>
        </div>
      </div>
    );
  }

  if (!designId || isLoading) {
    return <RoomDesignerWorkspaceSkeleton />;
  }

  if (isError || !loadedEngine) {
    const parsed = parseApiError(error);
    const disabled = parsed.status === 403;
    return (
      <div className="mx-auto max-w-lg p-6 text-center" data-testid="room-designer-page-error">
        <p className="text-sm text-muted-foreground">
          {disabled
            ? 'مصمّم الغرف غير متاح حالياً.'
            : parsed.message || 'تعذّر تحميل التصميم.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {!disabled ? (
            <button
              type="button"
              className="text-sm text-diyar-brown underline"
              onClick={() => void refetch()}
            >
              إعادة المحاولة
            </button>
          ) : null}
          <Link to="/profile" className="text-sm text-primary underline">
            العودة للملف الشخصي
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RoomDesignerShell engine={loadedEngine} designId={data!.id} designVersion={data!.version} />
  );
}
