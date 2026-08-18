import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as servicesApi from '../../api/services.ts';
import type { ServiceListFilters, ProviderPublic } from '../../types/services.ts';
import { serviceKeys } from './queryKeys.ts';

export function useServiceCategories() {
  return useQuery({
    queryKey: serviceKeys.categories(),
    queryFn: () => servicesApi.fetchServiceCategories(),
  });
}

export function useServices(filters: ServiceListFilters = {}) {
  return useQuery({
    queryKey: serviceKeys.list(filters),
    queryFn: () => servicesApi.fetchServices(filters),
  });
}

export function useService(identifier: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.detail(identifier ?? ''),
    queryFn: () => servicesApi.fetchService(identifier!),
    enabled: Boolean(identifier),
  });
}

export function useRelatedServices(identifier: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.related(identifier ?? ''),
    queryFn: () => servicesApi.fetchRelatedServices(identifier!),
    enabled: Boolean(identifier),
  });
}

export function useProvider(slug: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.providers.detail(slug ?? ''),
    queryFn: () => servicesApi.fetchProvider(slug!),
    enabled: Boolean(slug),
  });
}

export function useProviderServices(slug: string | undefined, filters: ServiceListFilters = {}) {
  return useQuery({
    queryKey: serviceKeys.providers.services(slug ?? '', filters),
    queryFn: () => servicesApi.fetchProviderServices(slug!, filters),
    enabled: Boolean(slug),
  });
}

export function useProviderFollow(slug: string | undefined) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => servicesApi.followProvider(slug!),
    onSuccess: (summary) => {
      if (slug) {
        queryClient.setQueryData<ProviderPublic | undefined>(
          serviceKeys.providers.detail(slug),
          (current) =>
            current
              ? {
                  ...current,
                  follow: summary,
                }
              : current,
        );
        void queryClient.invalidateQueries({ queryKey: serviceKeys.providers.detail(slug) });
      }
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: () => servicesApi.unfollowProvider(slug!),
    onSuccess: (summary) => {
      if (slug) {
        queryClient.setQueryData<ProviderPublic | undefined>(
          serviceKeys.providers.detail(slug),
          (current) =>
            current
              ? {
                  ...current,
                  follow: summary,
                }
              : current,
        );
        void queryClient.invalidateQueries({ queryKey: serviceKeys.providers.detail(slug) });
      }
    },
  });

  return { followMutation, unfollowMutation };
}
