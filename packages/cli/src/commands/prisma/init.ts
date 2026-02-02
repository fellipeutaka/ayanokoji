import { Command } from "commander";
import { formatZodErrors } from "~/utils/format-zod-errors";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import type { PrismaDatabase } from "./databases";
import { prismaDatabaseSchema } from "./schemas/database";

interface InitOptions {
  cwd: string;
  database?: string;
  withModel?: boolean;
  withScripts?: boolean;
}

export type ParsedInitOptions = Omit<InitOptions, "database"> & {
  database?: PrismaDatabase;
};

export const init = new Command()
  .name("init")
  .description("Init Prisma ORM")
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

    const { initPrisma } = await import("./helpers/init-prisma");
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

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  const result = prismaDatabaseSchema.safeParse(options.database);

  if (!result.success) {
    return new Err(formatZodErrors(result.error));
  }

  return new Ok({
    cwd: options.cwd,
    database: result.data as PrismaDatabase | undefined,
    withModel: options.withModel,
    withScripts: options.withScripts,
  });
}
