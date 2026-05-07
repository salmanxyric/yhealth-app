const isDev = process.env.NODE_ENV === "development";

function createLogger(tag: string) {
  const prefix = `[${tag}]`;
  return {
    debug: (...args: unknown[]) => {
      if (isDev) console.log(prefix, ...args);
    },
    info: (...args: unknown[]) => {
      if (isDev) console.info(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(prefix, ...args);
    },
  };
}

export const logger = createLogger("App");
export { createLogger };
