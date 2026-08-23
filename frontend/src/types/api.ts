/**
 * Standard API response envelope from DIYAR backend.
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[] | string> | string[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface HealthData {
  status: string;
  service: string;
  version: string;
  stage: string;
  environment?: string;
  timestamp: string;
  checks?: {
    database: { ok: boolean; driver: string };
    cache: { ok: boolean; driver: string };
  };
  maintenance?: {
    marketplace_enabled: boolean;
    message_ar: string;
    message_en: string;
  };
}

export interface ApiErrorDetail {
  message: string;
  status?: number;
  errors?: ApiErrorResponse['errors'];
}
