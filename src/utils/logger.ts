import picocolors from "picocolors";

export const logger = {
  error(input: string) {
    console.error(picocolors.red(input));
  },
  warn(input: string) {
    console.warn(picocolors.yellow(input));
  },
  info(input: string) {
    console.info(picocolors.cyan(input));
  },
  success(input: string) {
    console.info(picocolors.green(input));
  },
  log(input: string) {
    console.info(input);
  },
  break() {
    console.info("");
  },
};
