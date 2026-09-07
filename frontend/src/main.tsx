import { isLandingMode } from './lib/landing/mode.ts';

async function bootstrap() {
  if (isLandingMode()) {
    await import('./main.landing.tsx');
  } else {
    await import('./main.marketplace.tsx');
  }
}

void bootstrap();
