export function scrollContainerToBottom(
  container: HTMLDivElement | null,
  behavior: ScrollBehavior = 'auto',
): void {
  if (!container) {
    return;
  }

  const scroll = () => {
    container.scrollTop = container.scrollHeight;
  };

  if (behavior === 'smooth') {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
    return;
  }

  requestAnimationFrame(() => {
    scroll();
    requestAnimationFrame(scroll);
  });
}

export function isNearContainerBottom(container: HTMLDivElement | null, threshold = 80): boolean {
  if (!container) {
    return true;
  }

  return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
}
