import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { env } from '../env.ts';
import { readXsrfToken } from '../csrf.ts';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

export type RealtimeConnectionState =
  'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export function createEcho(): Echo<'reverb'> {
  if (echoInstance) {
    return echoInstance;
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: env.reverb.key,
    wsHost: env.reverb.host,
    wsPort: env.reverb.port,
    wssPort: env.reverb.port,
    forceTLS: env.reverb.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: '/broadcasting/auth',
    auth: {
      headers: {
        'X-XSRF-TOKEN': readXsrfToken() ?? '',
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance;
}
