import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { ensureCsrfCookie, readXsrfToken } from '../csrf.ts';
import { env, isRealtimeEnabled } from '../env.ts';
import { broadcastingAuthEndpoint, resolveReverbConnectionOptions } from './reverbConnection.ts';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

export type RealtimeConnectionState =
  'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'failed';

type StateListener = (state: RealtimeConnectionState) => void;
type EventHandler = (payload: unknown) => void;

type ChannelSubscription = {
  channelName: string;
  events: Map<string, Set<EventHandler>>;
  boundEvents: Set<string>;
  echoChannel: ReturnType<Echo<'reverb'>['private']> | null;
};

const CONNECT_TIMEOUT_MS = 12_000;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const EVENT_DEDUPE_TTL_MS = 30_000;

let reconnectAttempt = 0;

const recentEventKeys = new Map<string, number>();

function pruneRecentEventKeys(now: number): void {
  if (recentEventKeys.size < 256) {
    return;
  }

  for (const [key, seenAt] of recentEventKeys) {
    if (now - seenAt > EVENT_DEDUPE_TTL_MS) {
      recentEventKeys.delete(key);
    }
  }
}

function eventDedupeKey(channelName: string, eventName: string, payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const id =
    candidate.notification_id ?? candidate.message_id ?? candidate.event_id ?? candidate.id;

  if (typeof id === 'string' && id !== '') {
    return `${channelName}:${eventName}:${id}`;
  }

  return null;
}

function shouldDeliverEvent(channelName: string, eventName: string, payload: unknown): boolean {
  const key = eventDedupeKey(channelName, eventName, payload);
  if (key === null) {
    return true;
  }

  const now = Date.now();
  pruneRecentEventKeys(now);

  const seenAt = recentEventKeys.get(key);
  if (seenAt !== undefined && now - seenAt < EVENT_DEDUPE_TTL_MS) {
    return false;
  }

  recentEventKeys.set(key, now);

  return true;
}

let echoInstance: Echo<'reverb'> | null = null;
let connectionState: RealtimeConnectionState = 'idle';
let connectionHandlersBound = false;
let refCount = 0;
let connectTimeoutId: number | undefined;
let reconnectTimeoutId: number | undefined;
let csrfPrepared = false;
const stateListeners = new Set<StateListener>();
const channelSubscriptions = new Map<string, ChannelSubscription>();

const broadcastingAuthHeaders: Record<string, string> = {};
Object.defineProperties(broadcastingAuthHeaders, {
  'X-XSRF-TOKEN': {
    get: () => readXsrfToken() ?? '',
    enumerable: true,
  },
  Accept: {
    get: () => 'application/json',
    enumerable: true,
  },
});

function notifyState(state: RealtimeConnectionState): void {
  connectionState = state;
  stateListeners.forEach((listener) => listener(state));
}

function clearReconnectTimer(): void {
  window.clearTimeout(reconnectTimeoutId);
  reconnectTimeoutId = undefined;
}

function reconnectDelayMs(): number {
  const exponential = Math.min(
    MAX_RECONNECT_DELAY_MS,
    BASE_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
  );
  const jitter = Math.floor(Math.random() * 500);

  return exponential + jitter;
}

function safePusherConnect(): void {
  if (!echoInstance) {
    return;
  }

  const connection = echoInstance.connector.pusher.connection;
  const state = connection.state;

  if (state === 'connected' || state === 'connecting') {
    return;
  }

  if (state === 'closing' || state === 'closed') {
    echoInstance = null;
    connectionHandlersBound = false;
    ensureEcho();
    return;
  }

  try {
    echoInstance.connector.pusher.connect();
  } catch {
    echoInstance = null;
    connectionHandlersBound = false;
    ensureEcho();
  }
}

function scheduleReconnect(): void {
  if (refCount === 0 || !isRealtimeEnabled()) {
    return;
  }

  clearReconnectTimer();
  notifyState('reconnecting');

  const delay = reconnectDelayMs();
  reconnectAttempt += 1;

  reconnectTimeoutId = window.setTimeout(() => {
    reconnectTimeoutId = undefined;

    if (refCount === 0) {
      return;
    }

    if (echoInstance) {
      safePusherConnect();
      notifyState('connecting');
      return;
    }

    ensureEcho();
  }, delay);
}

function bindConnectionHandlers(): void {
  if (!echoInstance || connectionHandlersBound) {
    return;
  }

  connectionHandlersBound = true;
  const connector = echoInstance.connector.pusher.connection;

  connector.bind('connected', () => {
    window.clearTimeout(connectTimeoutId);
    clearReconnectTimer();
    reconnectAttempt = 0;
    notifyState('connected');
  });

  connector.bind('connecting', () => {
    notifyState('connecting');
  });

  connector.bind('disconnected', () => {
    notifyState('disconnected');
    scheduleReconnect();
  });

  connector.bind('failed', () => {
    window.clearTimeout(connectTimeoutId);
    notifyState('failed');
    scheduleReconnect();
  });

  connector.bind('unavailable', () => {
    window.clearTimeout(connectTimeoutId);
    notifyState('failed');
    scheduleReconnect();
  });

  connector.bind('error', () => {
    const state = connector.state;
    if (state === 'connected' || state === 'connecting') {
      return;
    }

    window.clearTimeout(connectTimeoutId);
    notifyState('failed');
    scheduleReconnect();
  });
}

function pageLocation(): { hostname: string; port: string; protocol: string } | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
  };
}

function authorizePrivateChannel(
  channelName: string,
  socketId: string,
  callback: (error: Error | null, data: { auth: string; channel_data?: string } | null) => void,
): void {
  void (async () => {
    try {
      const token = readXsrfToken();
      if (!token) {
        await ensureCsrfCookie();
      }

      const response = await fetch(broadcastingAuthEndpoint(env.backendUrl), {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': readXsrfToken() ?? '',
        },
        body: JSON.stringify({
          socket_id: socketId,
          channel_name: channelName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Broadcast auth failed (${response.status})`);
      }

      const data = (await response.json()) as { auth: string; channel_data?: string };
      callback(null, data);
    } catch (error) {
      callback(error instanceof Error ? error : new Error('Broadcast auth failed'), null);
    }
  })();
}

function ensureEcho(): Echo<'reverb'> | null {
  if (!isRealtimeEnabled()) {
    return null;
  }

  if (echoInstance) {
    return echoInstance;
  }

  const connection = resolveReverbConnectionOptions({
    isDev: import.meta.env.DEV,
    configuredHost: env.reverb.host,
    configuredPort: env.reverb.port,
    configuredScheme: env.reverb.scheme,
    location: pageLocation(),
  });

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: env.reverb.key,
    wsHost: connection.wsHost,
    wsPort: connection.wsPort,
    wssPort: connection.wssPort,
    forceTLS: connection.forceTLS,
    enabledTransports: connection.enabledTransports,
    disableStats: true,
    authEndpoint: broadcastingAuthEndpoint(env.backendUrl),
    auth: {
      headers: broadcastingAuthHeaders,
    },
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        authorizePrivateChannel(channel.name, socketId, callback);
      },
    }),
  });

  bindConnectionHandlers();

  notifyState('connecting');
  connectTimeoutId = window.setTimeout(() => {
    const state = echoInstance?.connector.pusher.connection.state;
    if (state !== 'connected') {
      notifyState('failed');
      scheduleReconnect();
    }
  }, CONNECT_TIMEOUT_MS);

  if (echoInstance.connector.pusher.connection.state === 'connected') {
    window.clearTimeout(connectTimeoutId);
    notifyState('connected');
  }

  return echoInstance;
}

function ensureEventListener(subscription: ChannelSubscription, eventName: string): void {
  if (!subscription.echoChannel || subscription.boundEvents.has(eventName)) {
    return;
  }

  subscription.boundEvents.add(eventName);
  subscription.echoChannel.listen(eventName, (payload: unknown) => {
    if (!shouldDeliverEvent(subscription.channelName, eventName, payload)) {
      return;
    }

    subscription.events.get(eventName)?.forEach((handler) => handler(payload));
  });
}

function attachChannelHandlers(subscription: ChannelSubscription): void {
  if (!echoInstance || subscription.echoChannel === null) {
    return;
  }

  subscription.events.forEach((_handlers, eventName) => {
    ensureEventListener(subscription, eventName);
  });
}

function acquireConnection(): void {
  refCount += 1;
  if (refCount === 1) {
    if (isRealtimeEnabled()) {
      ensureEcho();
    } else {
      notifyState('idle');
    }
  }
}

function releaseConnection(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0) {
    window.clearTimeout(connectTimeoutId);
    clearReconnectTimer();
    channelSubscriptions.forEach((subscription) => {
      if (subscription.echoChannel && echoInstance) {
        echoInstance.leave(`private-${subscription.channelName}`);
      }
      subscription.echoChannel = null;
    });
    if (echoInstance) {
      echoInstance.disconnect();
      echoInstance = null;
    }
    connectionHandlersBound = false;
    notifyState('idle');
  }
}

export async function prepareRealtimeConnection(): Promise<void> {
  if (!isRealtimeEnabled() || csrfPrepared) {
    return;
  }

  await ensureCsrfCookie();
  csrfPrepared = true;
}

export function getRealtimeConnectionState(): RealtimeConnectionState {
  return connectionState;
}

export function subscribeRealtimeConnection(listener: StateListener): () => void {
  stateListeners.add(listener);
  listener(connectionState);

  return () => {
    stateListeners.delete(listener);
  };
}

export const RealtimeEventRouter = {
  retain(): () => void {
    acquireConnection();

    return () => {
      releaseConnection();
    };
  },

  subscribePrivateChannel(
    channelName: string,
    eventName: string,
    handler: EventHandler,
  ): () => void {
    let subscription = channelSubscriptions.get(channelName);
    if (!subscription) {
      subscription = {
        channelName,
        events: new Map(),
        boundEvents: new Set(),
        echoChannel: null,
      };
      channelSubscriptions.set(channelName, subscription);
    }

    const handlers = subscription.events.get(eventName) ?? new Set<EventHandler>();
    handlers.add(handler);
    subscription.events.set(eventName, handlers);

    const echo = ensureEcho();
    if (echo && subscription.echoChannel === null) {
      subscription.echoChannel = echo.private(channelName);
      attachChannelHandlers(subscription);
    } else {
      ensureEventListener(subscription, eventName);
    }

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        subscription?.events.delete(eventName);
      }
      if (subscription && subscription.events.size === 0) {
        if (subscription.echoChannel && echoInstance) {
          echoInstance.leave(`private-${channelName}`);
        }
        channelSubscriptions.delete(channelName);
      }
    };
  },

  leaveChannel(channelName: string): void {
    const subscription = channelSubscriptions.get(channelName);
    if (!subscription) {
      return;
    }

    if (subscription.echoChannel && echoInstance) {
      echoInstance.leave(`private-${channelName}`);
    }

    channelSubscriptions.delete(channelName);
  },
};

export function createEcho(): Echo<'reverb'> {
  const echo = ensureEcho();
  if (!echo) {
    throw new Error('Realtime is not configured (missing VITE_REVERB_APP_KEY).');
  }

  return echo;
}

export function disconnectEcho(): void {
  while (refCount > 0) {
    releaseConnection();
  }
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance;
}
