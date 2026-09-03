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
  configuredHost: string;
  configuredPort: number;
  configuredScheme: string;
  location?: ReverbPageLocation;
}): ReverbConnectionOptions {
  const location = input.location;
  const pageIsHttps = location?.protocol === 'https:';

  if (input.isDev && location) {
    const devPort = location.port ? Number(location.port) : 3000;
    const forceTLS = pageIsHttps;

    return {
      wsHost: location.hostname,
      wsPort: devPort,
      wssPort: devPort,
      forceTLS,
      enabledTransports: forceTLS ? ['wss'] : ['ws'],
    };
  }

  const configuredHost = input.configuredHost.trim();
  const forceTLS = input.configuredScheme === 'https' || pageIsHttps;
  const wsHost = configuredHost || location?.hostname || 'localhost';

  let port = input.configuredPort;
  if (!configuredHost && location) {
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
