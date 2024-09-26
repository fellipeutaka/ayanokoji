import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import { getAdapterDocs } from "./helpers/get-adapter-docs";

export interface InitOptions {
  withModel?: boolean;
  withScripts?: boolean;
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init Drizzle ORM")
  .option("--with-model", "Create a schema example.")
  .option("--with-scripts", "Add useful scripts to package.json.")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: InitOptions) => {
    const optionsResult = await parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const { initDrizzle } = await import("./helpers/init-drizzle");
    const initResult = await initDrizzle(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    const config = initResult.value;
    const adapterDocs = getAdapterDocs(config.database.value, config.adapter);

    logger.break();
    logger.success("Drizzle ORM initialized.");
    logger.info(
      "Check out the Drizzle documentation to learn more about how to use it."
    );
    logger.info("https://orm.drizzle.team/docs/overview");
    logger.break();
    logger.info(
      `Check out the ${config.adapter.label} documentation for more information.`
    );
    logger.info(adapterDocs);
    logger.break();
  });

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
