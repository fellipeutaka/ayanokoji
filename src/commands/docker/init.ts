import fs from "node:fs";
import { Command } from "commander";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import { initDocker } from "./helpers/init-docker";

export interface InitOptions {
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init a Docker Compose")
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

    const initResult = await initDocker(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    logger.break();
    logger.success("Docker Compose file created.");
    logger.info(
      "You can now run `docker compose up` to start your Docker Compose."
    );
    logger.break();
    logger.info(
      "Check out the Docker Image documentation to learn more about how to use it."
    );
    logger.info(initResult.value.database.repositoryLink);
    logger.break();
  });

function parseOptions(options: InitOptions) {
  if (!fs.existsSync(options.cwd)) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
