export const MAX_SERVICE_REQUEST_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_ATTACHMENT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'] as const;

export function sanitizeBudgetInput(value: string): string {
  return value.replace(/[^\d,\-+–+\s]/g, '');
}

export function validateBudget(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d[\d,]*\+$/.test(trimmed)) {
    return null;
  }

  const rangeMatch = trimmed.match(/^(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)$/);
  if (rangeMatch) {
    const min = Number(rangeMatch[1].replace(/,/g, ''));
    const max = Number(rangeMatch[2].replace(/,/g, ''));
    if (Number.isNaN(min) || Number.isNaN(max) || min <= 0 || max <= 0) {
      return 'أدخل ميزانية صحيحة.';
    }
    if (min >= max) {
      return 'يجب أن يكون الحد الأعلى أكبر من الحد الأدنى.';
    }
    return null;
  }

  if (/^\d[\d,]*$/.test(trimmed)) {
    const amount = Number(trimmed.replace(/,/g, ''));
    if (Number.isNaN(amount) || amount <= 0) {
      return 'أدخل ميزانية صحيحة.';
    }
    return null;
  }

  return 'استخدم رقماً واحداً (5000) أو نطاقاً (100-5000) أو حداً أدنى (5000+).';
}

export function parseBudget(value: string): { budget_min?: number; budget_max?: number } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {};
  }

  const plusMatch = trimmed.match(/^(\d[\d,]*)\+$/);
  if (plusMatch) {
    return {
      budget_min: Number(plusMatch[1].replace(/,/g, '')),
    };
  }

  const rangeMatch = trimmed.match(/^(\d[\d,]*)\s*[-–]\s*(\d[\d,]*)$/);
  if (rangeMatch) {
    return {
      budget_min: Number(rangeMatch[1].replace(/,/g, '')),
      budget_max: Number(rangeMatch[2].replace(/,/g, '')),
    };
  }

  const single = Number(trimmed.replace(/,/g, ''));
  if (!Number.isNaN(single) && single > 0) {
    return { budget_max: single };
  }

  return {};
}

export function isValidReferenceUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function parseReferenceLinks(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((link) => link.trim())
    .filter(Boolean);
}

export function validateReferenceLinksInput(value: string): string | null {
  const links = parseReferenceLinks(value);
  if (links.length === 0) {
    return null;
  }

  if (links.length > 10) {
    return 'الحد الأقصى 10 روابط مرجعية.';
  }

  const invalid = links.find((link) => !isValidReferenceUrl(link));
  if (invalid) {
    return `الرابط غير صالح: ${invalid}`;
  }

  return null;
}

export function validateServiceRequestFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (
    !ALLOWED_ATTACHMENT_EXTENSIONS.includes(
      extension as (typeof ALLOWED_ATTACHMENT_EXTENSIONS)[number],
    )
  ) {
    return 'الملفات المسموحة: PDF, JPEG, JPG, PNG, WEBP.';
  }

  if (
    file.type &&
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number],
    )
  ) {
    return 'نوع الملف غير مدعوم.';
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return 'حجم كل ملف يجب ألا يتجاوز 10 ميجابايت.';
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageAttachment(file: File): boolean {
  return file.type.startsWith('image/');
}
