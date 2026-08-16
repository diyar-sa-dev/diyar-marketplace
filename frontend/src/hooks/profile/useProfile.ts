import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as profileApi from '../../api/profile.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';
import type { UpdateProfilePayload } from '../../types/profile.ts';
import { addressKeys, profileKeys } from './queryKeys.ts';

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: profileApi.fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthContext();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.updateProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
      await refreshUser();
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthContext();

  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: async (result) => {
      updateUser(result.profile);
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthContext();

  return useMutation({
    mutationFn: () => profileApi.deleteAvatar(),
    onSuccess: async (result) => {
      updateUser(result.profile);
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: profileApi.fetchAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.createAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof profileApi.updateAddress>[1];
    }) => profileApi.updateAddress(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profileApi.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => profileApi.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useRequestPhoneChange() {
  return useMutation({
    mutationFn: (phone: string) => profileApi.requestPhoneChange(phone),
  });
}

export function useResendPhoneChange() {
  return useMutation({
    mutationFn: (phone: string) => profileApi.resendPhoneChange(phone),
  });
}

export function useVerifyPhoneChange() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthContext();

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      profileApi.verifyPhoneChange(phone, code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all });
      await refreshUser();
    },
  });
}
