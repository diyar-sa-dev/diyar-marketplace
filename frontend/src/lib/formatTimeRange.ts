/**
 * Format a time range with Latin digits (consistent across locales).
 */
export function formatTimeRange(
  opensAt: string | null,
  closesAt: string | null,
  _locale: string,
): string {
  if (!opensAt || !closesAt) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const base = new Date();
  const [openH, openM] = opensAt.split(':').map(Number);
  const [closeH, closeM] = closesAt.split(':').map(Number);
  const openDate = new Date(base);
  openDate.setHours(openH, openM, 0, 0);
  const closeDate = new Date(base);
  closeDate.setHours(closeH, closeM, 0, 0);

  return `${formatter.format(openDate)} - ${formatter.format(closeDate)}`;
}
