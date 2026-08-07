import picocolors from "picocolors";

const c = console;

export const logger = {
  break() {
    c.info("");
  },
  error(input: string) {
    c.error(picocolors.red(input));
  },
  info(input: string) {
    c.info(picocolors.cyan(input));
  },
  success(input: string) {
    c.info(picocolors.green(input));
  },
  warn(input: string) {
    c.warn(picocolors.yellow(input));
  },
};
