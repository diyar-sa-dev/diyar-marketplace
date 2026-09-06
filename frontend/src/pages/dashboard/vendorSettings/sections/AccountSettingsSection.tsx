import { Link } from 'react-router-dom';
import { LoadingState } from '../../../../components/common/LoadingState.tsx';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import { UserAvatar } from '../../../../components/profile/UserAvatar.tsx';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type AccountSettingsSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'profileLoading'
  | 'displayName'
  | 'displayAvatarUrl'
  | 'fieldErrors'
  | 'uploadAvatar'
  | 'deleteAvatar'
  | 'handleMutationError'
  | 'toast'
>;

export function AccountSettingsSection({
  t,
  profileLoading,
  displayName,
  displayAvatarUrl,
  fieldErrors,
  uploadAvatar,
  deleteAvatar,
  handleMutationError,
  toast,
}: AccountSettingsSectionProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-2xl">
      {profileLoading ? (
        <LoadingState />
      ) : (
        <>
          <div>
            <h3 className="font-bold text-diyar-dark mb-4">
              {t('vendor.settings.account.avatarTitle')}
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <UserAvatar
                name={displayName}
                avatarUrl={displayAvatarUrl}
                editable
                isUploading={uploadAvatar.isPending}
                isDeleting={deleteAvatar.isPending}
                onUpload={(file) => {
                  void uploadAvatar
                    .mutateAsync(file)
                    .then((result) => {
                      toast.success(result.message ?? t('vendor.settings.account.saveSuccess'));
                    })
                    .catch(handleMutationError);
                }}
                onDelete={() => {
                  void deleteAvatar
                    .mutateAsync()
                    .then((result) => {
                      toast.success(result.message ?? t('vendor.settings.account.saveSuccess'));
                    })
                    .catch(handleMutationError);
                }}
              />
              <div className="flex-1">
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('vendor.settings.account.avatarFormats')}
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="mt-4 text-sm font-bold text-diyar-brown border border-diyar-brown px-5 py-2.5 rounded-xl hover:bg-amber-50 transition inline-block"
            >
              {t('vendor.settings.account.manageProfile')}
            </Link>
            <FieldError message={fieldErrors.avatar} />
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="font-bold text-diyar-dark mb-2">
              {t('vendor.settings.account.securityLink')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t('vendor.settings.account.securityHint')}
            </p>
            <Link
              to="/profile/security"
              className="text-sm font-bold text-diyar-brown border border-diyar-brown px-5 py-2.5 rounded-xl hover:bg-amber-50 transition inline-block"
            >
              {t('vendor.settings.account.securityLink')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
