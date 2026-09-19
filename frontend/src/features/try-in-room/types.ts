export type TryInRoomJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface TryInRoomJob {
  id: string;
  status: TryInRoomJobStatus;
  product_id: string | null;
  room_design_id: string | null;
  error_code: string | null;
  result: Record<string, unknown> | null;
  result_url: string | null;
  expires_at: string | null;
  created_at: string | null;
  completed_at: string | null;
}

export type TryInRoomFlowPhase =
  | 'idle'
  | 'uploading'
  | 'polling'
  | 'completed'
  | 'failed';
