/**
 * Global jest setup. Mocks the heavy Azure SDKs used by service implementations
 * so unit tests never reach a real network. Per-test mocks override these
 * defaults via `jest.mock(..., factory)`.
 */

// Silence pino in tests
jest.mock('pino', () => {
  const noop = () => undefined;
  const child = () => logger;
  const logger: Record<string, unknown> = {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    child,
    level: 'silent',
  };
  const factory = () => logger;
  // pino's default export is callable
  return Object.assign(factory, { default: factory });
});
