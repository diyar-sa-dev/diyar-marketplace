export type ReverbPageLocation = {
  hostname: string;
  port: string;
  protocol: string;
};

export type ReverbConnectionOptions = {
  wsHost: string;
  wsPort: number;
  wssPort: number;
  forceTLS: boolean;
  enabledTransports: Array<'ws' | 'wss'>;
};

export function broadcastingAuthEndpoint(backendUrl: string): string {
  const base = backendUrl.replace(/\/$/, '');
  return base === '' ? '/broadcasting/auth' : `${base}/broadcasting/auth`;
}

export function resolveReverbConnectionOptions(input: {
  isDev: boolean;
  /** True when API calls use same-origin paths (Vite proxy), not a separate backend URL. */
  sameOriginApi?: boolean;
  configuredHost: string;
  configuredPort: number;
  configuredScheme: string;
  location?: ReverbPageLocation;
}): ReverbConnectionOptions {
  const location = input.location;
  const pageIsHttps = location?.protocol === 'https:';
  const configuredHost = input.configuredHost.trim();
  const useDevProxy = input.isDev && input.sameOriginApi !== false && location;

  // Vite dev server proxies /app/* to Reverb — always prefer that when API is same-origin.
  if (useDevProxy) {
    const devPort = location.port ? Number(location.port) : 3000;

    return {
      wsHost: location.hostname,
      wsPort: devPort,
      wssPort: devPort,
      forceTLS: pageIsHttps,
      enabledTransports: pageIsHttps ? ['wss'] : ['ws'],
    };
  }

  // Explicit Reverb host (split SPA + API in production preview / deployed builds).
  if (configuredHost) {
    const forceTLS = input.configuredScheme === 'https' || pageIsHttps;
    let port = input.configuredPort;
    if (forceTLS && (port === 0 || port === 80 || port === 8090)) {
      port = 443;
    } else if (!forceTLS && (port === 0 || Number.isNaN(port))) {
      port = 80;
    }

    return {
      wsHost: configuredHost,
      wsPort: port,
      wssPort: port,
      forceTLS,
      enabledTransports: forceTLS ? ['wss'] : ['ws'],
    };
  }

  const forceTLS = input.configuredScheme === 'https' || pageIsHttps;
  const wsHost = location?.hostname || 'localhost';

  let port = input.configuredPort;
  if (location) {
    port = location.port ? Number(location.port) : forceTLS ? 443 : 80;
  } else if (forceTLS && (port === 0 || port === 80 || port === 8090)) {
    port = 443;
  } else if (!forceTLS && (port === 0 || Number.isNaN(port))) {
    port = 80;
  }

  return {
    wsHost,
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: forceTLS ? ['wss'] : ['ws'],
  };
}
