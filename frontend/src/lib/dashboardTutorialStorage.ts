const SKIP_KEY = 'diyar:skip-dashboard-tutorial';

export function skipDashboardTutorial(): void {
  try {
    localStorage.setItem(SKIP_KEY, '1');
  } catch {
    // ignore storage failures
  }
}

export function shouldShowDashboardTutorial(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) !== '1';
  } catch {
    return true;
  }
}
