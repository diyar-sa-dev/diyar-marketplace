import { describe, expect, it } from 'vitest';
import { broadcastingAuthEndpoint, resolveReverbConnectionOptions } from './reverbConnection.ts';

describe('broadcastingAuthEndpoint', () => {
  it('uses a relative path on same-origin installs', () => {
    expect(broadcastingAuthEndpoint('')).toBe('/broadcasting/auth');
  });

  it('points at the API origin when the SPA is hosted separately', () => {
    expect(broadcastingAuthEndpoint('https://api.diyar.sa')).toBe(
      'https://api.diyar.sa/broadcasting/auth',
    );
    expect(broadcastingAuthEndpoint('https://api.diyar.sa/')).toBe(
      'https://api.diyar.sa/broadcasting/auth',
    );
  });
});

describe('resolveReverbConnectionOptions', () => {
  it('uses an explicit Reverb host when API is on a separate origin (split SPA+API)', () => {
    expect(
      resolveReverbConnectionOptions({
        isDev: true,
        sameOriginApi: false,
        configuredHost: '192.168.1.10',
        configuredPort: 8093,
        configuredScheme: 'http',
        location: { hostname: '192.168.1.20', port: '3001', protocol: 'http:' },
      }),
    ).toEqual({
      wsHost: '192.168.1.10',
      wsPort: 8093,
      wssPort: 8093,
      forceTLS: false,
      enabledTransports: ['ws'],
    });
  });

  it('proxies through the current Vite origin in development when API is same-origin', () => {
    expect(
      resolveReverbConnectionOptions({
        isDev: true,
        sameOriginApi: true,
        configuredHost: 'localhost',
        configuredPort: 8090,
        configuredScheme: 'http',
        location: { hostname: '192.168.1.20', port: '3001', protocol: 'http:' },
      }),
    ).toEqual({
      wsHost: '192.168.1.20',
      wsPort: 3001,
      wssPort: 3001,
      forceTLS: false,
      enabledTransports: ['ws'],
    });
  });

  it('proxies through the current Vite origin when host is not set', () => {
    expect(
      resolveReverbConnectionOptions({
        isDev: true,
        sameOriginApi: true,
        configuredHost: '',
        configuredPort: 8090,
        configuredScheme: 'http',
        location: { hostname: '192.168.1.20', port: '3001', protocol: 'http:' },
      }),
    ).toEqual({
      wsHost: '192.168.1.20',
      wsPort: 3001,
      wssPort: 3001,
      forceTLS: false,
      enabledTransports: ['ws'],
    });
  });

  it('uses same-origin wss on https production when host is not set', () => {
    expect(
      resolveReverbConnectionOptions({
        isDev: false,
        configuredHost: '',
        configuredPort: 8090,
        configuredScheme: 'http',
        location: { hostname: 'diyar.sa', port: '', protocol: 'https:' },
      }),
    ).toEqual({
      wsHost: 'diyar.sa',
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['wss'],
    });
  });

  it('keeps an explicit Reverb host on 443 with wss only', () => {
    expect(
      resolveReverbConnectionOptions({
        isDev: false,
        configuredHost: 'diyar-reverb.onrender.com',
        configuredPort: 443,
        configuredScheme: 'https',
        location: { hostname: 'diyar.vercel.app', port: '', protocol: 'https:' },
      }),
    ).toEqual({
      wsHost: 'diyar-reverb.onrender.com',
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['wss'],
    });
  });
});
