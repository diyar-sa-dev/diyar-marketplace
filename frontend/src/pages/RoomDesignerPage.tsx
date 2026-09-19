import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { parseApiError } from '../utils/errors.ts';
import { createSpatialEngineFromDocument, createSpatialEngineFromPreset } from '../features/room-designer/application/spatialEngine.ts';
import { useCreateRoomDesignMutation, useRoomDesignQuery } from '../features/room-designer/persistence/useRoomDesignQuery.ts';
import { RoomDesignerShell } from '../features/room-designer/ui/RoomDesignerShell.tsx';

export default function RoomDesignerPage() {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();
  const createStarted = useRef(false);

  const { data, isLoading, isError, error } = useRoomDesignQuery(designId, Boolean(designId));
  const createMutation = useCreateRoomDesignMutation();

  useEffect(() => {
    if (designId || createStarted.current || createMutation.isPending) {
      return;
    }
    createStarted.current = true;
    const preset = createSpatialEngineFromPreset('majlis');
    if (preset.ok === false) {
      return;
    }
    createMutation.mutate(
      { title: null, document: preset.state.document },
      {
        onSuccess: (record) => {
          navigate(`/profile/room-designer/${record.id}`, { replace: true });
        },
        onError: () => {
          createStarted.current = false;
        },
      },
    );
  }, [createMutation, designId, navigate]);

  const engine = useMemo(() => {
    if (!data?.document) {
      return null;
    }
    return createSpatialEngineFromDocument(data.document);
  }, [data?.document]);

  if (!designId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" data-testid="room-designer-page-loading">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (isLoading || !engine) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" data-testid="room-designer-page-loading">
        <Loader2 className="animate-spin text-muted-foreground" size={28} />
      </div>
    );
  }

  if (isError) {
    const parsed = parseApiError(error);
    const disabled = parsed.status === 403;
    return (
      <div className="mx-auto max-w-lg p-6 text-center" data-testid="room-designer-page-error">
        <p className="text-sm text-muted-foreground">
          {disabled
            ? 'مصمّم الغرف غير متاح حالياً.'
            : parsed.message || 'تعذّر تحميل التصميم.'}
        </p>
        <Link to="/profile" className="mt-4 inline-block text-sm text-primary underline">
          العودة للملف الشخصي
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-3 md:p-4" data-testid="room-designer-page">
      <RoomDesignerShell engine={engine} designId={data!.id} designVersion={data!.version} />
    </div>
  );
}
