/** Encode local public asset paths (spaces, Arabic) for use in img src. */
export function staticAsset(path: string): string {
  if (!path || path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return encodeURI(path);
}
