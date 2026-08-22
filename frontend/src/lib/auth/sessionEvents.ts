import type { ApplicationContext } from './applicationContext.ts';

type UnauthorizedHandler = () => void;

const handlers: Record<ApplicationContext, Set<UnauthorizedHandler>> = {
  marketplace: new Set(),
  admin: new Set(),
};

export function registerUnauthorizedHandler(
  context: ApplicationContext,
  handler: UnauthorizedHandler,
): () => void {
  handlers[context].add(handler);

  return () => {
    handlers[context].delete(handler);
  };
}

export function notifyUnauthorized(context: ApplicationContext): void {
  handlers[context].forEach((handler) => handler());
}
