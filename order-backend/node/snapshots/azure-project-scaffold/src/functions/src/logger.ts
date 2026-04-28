import pino from 'pino';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'order-processing' },
});

export function getLogger(name?: string): pino.Logger {
  return name ? baseLogger.child({ module: name }) : baseLogger;
}
