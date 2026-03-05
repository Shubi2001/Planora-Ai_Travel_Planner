import pino from "pino";

const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  // pino-pretty is only available in dev, use simple format otherwise
  ...(isDev
    ? {}
    : {
        formatters: {
          level: (label: string) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      }),
  base: {
    env: process.env.APP_ENV ?? process.env.NODE_ENV,
  },
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.apiKey"],
    censor: "[REDACTED]",
  },
});

export function createLogger(context: string) {
  return logger.child({ context });
}
