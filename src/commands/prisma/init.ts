import fs from "node:fs";
import { Command } from "commander";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import { initPrisma } from "./helpers/init-prisma";

export interface InitOptions {
  withModel?: boolean;
  withScripts?: boolean;
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init Prisma ORM")
  .option("--with-model", "Create a schema example.")
  .option("--with-scripts", "Add useful scripts to package.json.")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: InitOptions) => {
    const optionsResult = parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const initResult = await initPrisma(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    logger.break();
    logger.success("Prisma ORM initialized.");
    logger.info(
      "Check out the Prisma documentation to learn more about how to use it."
    );
    logger.info("https://www.prisma.io/docs");
    logger.break();
  });

function parseOptions(options: InitOptions) {
  if (!fs.existsSync(options.cwd)) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
