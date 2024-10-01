import { Command } from "commander";
import { safeParseAsync } from "valibot";
import { formatValibotErrors } from "~/utils/format-valibot-errors";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import type { DrizzleDatabase } from "./databases";
import { getAdapterDocs } from "./helpers/get-adapter-docs";
import { drizzleDatabaseSchema } from "./schemas/database";

interface InitOptions {
  cwd: string;
  database?: string;
  withModel?: boolean;
  withScripts?: boolean;
}

export type ParsedInitOptions = Omit<InitOptions, "database"> & {
  database?: DrizzleDatabase;
};

export const init = new Command()
  .name("init")
  .description("Init Drizzle ORM")
  .option("--database <database>", "The database to use.")
  .option("--with-model", "Create a schema example.")
  .option("--with-scripts", "Add useful scripts to package.json.")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
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

  const result = await safeParseAsync(drizzleDatabaseSchema, options.database);

  if (result.issues) {
    return new Err(formatValibotErrors(result.issues));
  }

  return new Ok({
    cwd: options.cwd,
    database: result.output,
    withModel: options.withModel,
    withScripts: options.withScripts,
  });
}
