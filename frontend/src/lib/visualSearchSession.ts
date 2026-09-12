const PREVIEW_STORAGE_PREFIX = 'visual-search-preview:';

interface VisualSearchSession {
  searchId: string;
  file: File;
}

let activeSession: VisualSearchSession | null = null;

function previewStorageKey(searchId: string): string {
  return `${PREVIEW_STORAGE_PREFIX}${searchId}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image preview'));
    reader.readAsDataURL(file);
  });
}

function readStoredPreview(searchId: string): string | undefined {
  try {
    const stored = sessionStorage.getItem(previewStorageKey(searchId));
    return stored && stored.startsWith('data:') ? stored : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredPreview(searchId: string, dataUrl: string): void {
  try {
    sessionStorage.setItem(previewStorageKey(searchId), dataUrl);
  } catch {
    // Quota exceeded — in-memory session still supports pagination refetches.
  }
}

function clearStoredPreview(searchId: string): void {
  try {
    sessionStorage.removeItem(previewStorageKey(searchId));
  } catch {
    // Ignore storage failures during cleanup.
  }
}

export async function saveVisualSearchSession(session: VisualSearchSession): Promise<void> {
  if (activeSession && activeSession.searchId !== session.searchId) {
    clearStoredPreview(activeSession.searchId);
  }

  const dataUrl = await fileToDataUrl(session.file);
  writeStoredPreview(session.searchId, dataUrl);
  activeSession = session;
}

export function getVisualSearchSession(searchId: string | null | undefined): VisualSearchSession | null {
  if (!searchId || !activeSession || activeSession.searchId !== searchId) {
    return null;
  }

  return activeSession;
}

export function getVisualSearchPreviewUrl(searchId: string | null | undefined): string | undefined {
  if (!searchId) {
    return undefined;
  }

  return readStoredPreview(searchId);
}

export function releaseVisualSearchSession(searchId?: string | null): void {
  const id = searchId ?? activeSession?.searchId;
  if (id) {
    clearStoredPreview(id);
  }

  if (!searchId || activeSession?.searchId === searchId) {
    activeSession = null;
  }
}
