import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RoomDesignDocument } from '../domain/models.ts';
import {
  createRoomDesign,
  fetchRoomDesign,
  fetchRoomDesignList,
  roomDesignKeys,
  updateRoomDesign,
} from './roomDesignApi.ts';

export function useRoomDesignQuery(designId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: designId ? roomDesignKeys.detail(designId) : roomDesignKeys.all,
    queryFn: () => fetchRoomDesign(designId!),
    enabled: Boolean(designId) && enabled,
  });
}

export function useRoomDesignListQuery(page = 1, perPage = 20, enabled = true) {
  return useQuery({
    queryKey: roomDesignKeys.list(page, perPage),
    queryFn: () => fetchRoomDesignList(page, perPage),
    enabled,
  });
}

export function useCreateRoomDesignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoomDesign,
    onSuccess: (record) => {
      queryClient.setQueryData(roomDesignKeys.detail(record.id), record);
      void queryClient.invalidateQueries({ queryKey: roomDesignKeys.all });
    },
  });
}

export function useUpdateRoomDesignMutation(designId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { expected_version: number; document: RoomDesignDocument }) =>
      updateRoomDesign(designId, payload),
    onSuccess: (record) => {
      queryClient.setQueryData(roomDesignKeys.detail(designId), record);
    },
  });
}
