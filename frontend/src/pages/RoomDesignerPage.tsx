import { useNavigate, useParams } from 'react-router-dom';
import { RoomDesignerWorkspace } from '../features/room-designer/ui/RoomDesignerWorkspace.tsx';

export default function RoomDesignerPage() {
  const { designId } = useParams<{ designId: string }>();
  const navigate = useNavigate();

  return (
    <div
      className="mx-auto max-w-7xl h-[calc(100dvh-115px)] min-h-[640px] p-2 sm:p-3 md:p-4 flex flex-col overflow-hidden"
      data-testid="room-designer-page"
    >
      <RoomDesignerWorkspace
        designIdFromRoute={designId}
        onCreated={(id) => navigate(`/profile/room-designer/${id}`, { replace: true })}
      />
    </div>
  );
}
