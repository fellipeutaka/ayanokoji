import { Command } from "commander";
import { safeParseAsync } from "valibot";
import { formatValibotErrors } from "~/utils/format-valibot-errors";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import { getRepositoryLink } from "./helpers/get-repository-link";
import { dockerDatabaseSchema } from "./schemas/database";

interface InitOptions {
  database?: string;
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init a Docker Compose")
  .option("--database <database>", "the database to use.")
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

    const { initDocker } = await import("./helpers/init-docker");
    const initResult = await initDocker(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    const { namespace, repository } = initResult.value;
    const repositoryLink = getRepositoryLink(namespace, repository);

    logger.break();
    logger.success("Docker Compose file created.");
    logger.info(
      "You can now run `docker compose up` to start your Docker Compose."
    );
    logger.break();
    logger.info(
      "Check out the Docker Image documentation to learn more about how to use it."
    );
    logger.info(repositoryLink);
    logger.break();
  });

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  const result = await safeParseAsync(dockerDatabaseSchema, options.database);

  if (result.issues) {
    return new Err(formatValibotErrors(result.issues));
  }

  return new Ok({
    cwd: options.cwd,
    database: result.output,
  });
}
