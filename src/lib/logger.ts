// ================================================================
// Tiny structured logger.
// ================================================================
// Why: console.log is fine in dev but in production it (a) leaks PII
// into logs that ship to Vercel/Datadog without context, and (b) bloats
// log volume because we have ~50 console.log calls scattered through
// the AI routes. This wrapper:
//   - Suppresses .debug/.info in production (NODE_ENV === "production")
//   - Always emits .warn/.error so prod incidents stay observable
//   - Adds a [scope] prefix so log search ("[briefing]") becomes useful
//   - Stays sync (no batching, no transports) so we can drop it in
//     anywhere without wiring config
//
// Drop-in usage:
//   import { createLogger } from "@/lib/logger";
//   const log = createLogger("briefing");
//   log.debug("…", obj);    // dev only
//   log.warn("…");          // always
//   log.error("…", err);    // always

type LogArgs = unknown[];

const isProd = process.env.NODE_ENV === "production";
const isVerbose = process.env.LOG_VERBOSE === "1";

export interface Logger {
  debug: (...args: LogArgs) => void;
  info: (...args: LogArgs) => void;
  warn: (...args: LogArgs) => void;
  error: (...args: LogArgs) => void;
}

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;
  return {
    debug: (...args: LogArgs) => {
      if (!isProd || isVerbose) console.log(prefix, ...args);
    },
    info: (...args: LogArgs) => {
      if (!isProd || isVerbose) console.log(prefix, ...args);
    },
    warn: (...args: LogArgs) => {
      console.warn(prefix, ...args);
    },
    error: (...args: LogArgs) => {
      console.error(prefix, ...args);
    },
  };
}
