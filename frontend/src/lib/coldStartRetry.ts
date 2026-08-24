import axios from 'axios';

function isRetryableColdStartError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  return error.code === 'ECONNABORTED' || error.response?.status === 408;
}

/** Retry once after Render free-tier cold start / Vercel proxy timeout. */
export async function withColdStartRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isRetryableColdStartError(error)) {
      throw error;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 3000));

    return operation();
  }
}
