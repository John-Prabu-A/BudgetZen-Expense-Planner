/**
 * Production-ready logger
 * Silences logs in production unless they are errors or warnings
 */

const isDev = __DEV__;

export const Logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    console.warn(...args);
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
  // Use debug for extremely verbose logs
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

export default Logger;
