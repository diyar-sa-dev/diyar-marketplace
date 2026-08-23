export function formatPhoneDisplay(phone?: string | null): string | null {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}
