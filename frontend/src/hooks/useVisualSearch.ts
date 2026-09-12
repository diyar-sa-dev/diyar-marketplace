import { useMutation } from '@tanstack/react-query';
import { postVisualSearch } from '../api/visualSearch.ts';
import type { VisualSearchResponse } from '../types/visualSearch.ts';

interface VisualSearchVariables {
  file: File;
  page?: number;
  perPage?: number;
}

export function useVisualSearch() {
  return useMutation<VisualSearchResponse, unknown, VisualSearchVariables>({
    mutationFn: ({ file, page, perPage }) => postVisualSearch(file, page, perPage),
  });
}
