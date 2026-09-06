import type { Dispatch, SetStateAction } from 'react';
import type {
  BusinessEntityType,
  SaudiBankCode,
  VendorSettings,
  VendorWorkingHour,
  Weekday,
} from '../../../api/vendorSettings.ts';
import type { Locale } from '../../../lib/i18n/types.ts';

export const TAB_IDS = [
  'store',
  'appearance',
  'business',
  'shipping',
  'returns',
  'account',
  'notifications',
] as const;

export type SettingsTab = (typeof TAB_IDS)[number];

export const WEEKDAYS: Weekday[] = [
  'saturday',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
];

export const BANK_CODES: SaudiBankCode[] = ['snb', 'alrajhi', 'riyad', 'bsf'];

export const ENTITY_TYPES: BusinessEntityType[] = [
  'sole_proprietorship',
  'freelancer_document',
  'company',
];

export const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const INPUT_CLASS =
  'w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown bg-gray-50/50 placeholder:text-gray-400 text-start';

export type StoreFormState = {
  businessName: string;
  storeSlug: string;
  websiteUrl: string;
  description: string;
  location: string;
  supportPhone: string;
  supportEmail: string;
  workingHours: VendorWorkingHour[];
};

export type BusinessFormState = {
  entityType: BusinessEntityType;
  crNumber: string;
  taxNumber: string;
  bankCode: SaudiBankCode;
  beneficiaryName: string;
  iban: string;
  ibanEditing: boolean;
};

export type NotificationsFormState = {
  selectedLanguage: Locale;
  emailNotifications: boolean;
};

export type VendorSettingsHandlerDeps = {
  locale: Locale;
  settings: VendorSettings | undefined;
  profile: { preferences?: Record<string, unknown> } | undefined;
  t: (key: string, params?: Record<string, string>) => string;
  toast: {
    error: (message: string) => void;
    warning: (message: string) => void;
    success: (message: string) => void;
  };
  setLocale: (locale: Locale) => void;
  setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
  storeForm: StoreFormState;
  businessForm: BusinessFormState;
  notificationsForm: NotificationsFormState;
  setBusinessForm: Dispatch<SetStateAction<BusinessFormState>>;
  setNotificationsForm: Dispatch<SetStateAction<NotificationsFormState>>;
  mutations: {
    updateSettings: { mutateAsync: (payload: unknown) => Promise<unknown> };
    updateWorkingHours: { mutateAsync: (hours: VendorWorkingHour[]) => Promise<unknown> };
    uploadLogo: { mutateAsync: (file: File) => Promise<unknown> };
    deleteLogo: { mutateAsync: () => Promise<unknown> };
    uploadCover: { mutateAsync: (file: File) => Promise<unknown> };
    deleteCover: { mutateAsync: () => Promise<unknown> };
    updateLegal: { mutateAsync: (payload: unknown) => Promise<unknown> };
    updateBank: { mutateAsync: (payload: unknown) => Promise<unknown> };
    updateProfile: { mutateAsync: (payload: unknown) => Promise<unknown> };
  };
};
