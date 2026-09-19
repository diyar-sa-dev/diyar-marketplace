import type { RoomDesignDocument } from '../domain/models.ts';

export type RoomDesignSyncState = 'LOCAL' | 'SYNCING' | 'SYNCED' | 'ERROR' | 'CONFLICT';

export interface RoomDesignRecord {
  id: string;
  title: string | null;
  version: number;
  schema_version: number;
  item_count: number;
  document: RoomDesignDocument;
  created_at: string;
  updated_at: string;
}

export interface RoomDesignListItem {
  id: string;
  title: string | null;
  preset_id: string | null;
  item_count: number;
  version: number;
  updated_at: string;
}

export interface SaveRoomDesignPayload {
  expected_version: number;
  document: RoomDesignDocument;
}

export interface VersionConflictError {
  code: 'version_conflict';
  server_version: number;
  message: string;
}
