import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '../../api/vendorSettings.ts';
import type { VendorSettings, VendorWorkingHour } from '../../api/vendorSettings.ts';
import { vendorKeys } from '../catalog/queryKeys.ts';

export const vendorSettingsKeys = {
  all: ['vendor-settings'] as const,
  detail: () => [...vendorSettingsKeys.all, 'detail'] as const,
};

export function useVendorSettings() {
  return useQuery({
    queryKey: vendorSettingsKeys.detail(),
    queryFn: settingsApi.fetchVendorSettings,
  });
}

export function useUpdateVendorSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateVendorSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(vendorSettingsKeys.detail(), settings);
      void queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
    },
  });
}

export function useUploadVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.uploadVendorLogo,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useDeleteVendorLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deleteVendorLogo,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useUploadVendorCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.uploadVendorCover,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useDeleteVendorCover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.deleteVendorCover,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useUpdateVendorLegalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateVendorLegalProfile,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useUpdateVendorBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.updateVendorBankAccount,
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export function useUpdateVendorWorkingHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hours: VendorWorkingHour[]) => settingsApi.updateVendorWorkingHours(hours),
    onSuccess: (settings) => queryClient.setQueryData(vendorSettingsKeys.detail(), settings),
  });
}

export type { VendorSettings };
