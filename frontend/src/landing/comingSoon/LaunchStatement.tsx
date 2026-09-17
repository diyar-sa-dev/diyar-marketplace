import { COMING_SOON_COPY } from './copy.ts';

export function LaunchStatement() {
  return (
    <div className="coming-soon-enter coming-soon-enter-8 text-center md:text-start">
      <p className="coming-soon-launch">{COMING_SOON_COPY.launchStatement}</p>
      <p className="coming-soon-closing">{COMING_SOON_COPY.closing}</p>
    </div>
  );
}
