import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import { generateConnectionString } from "./helpers/generate-connection-string";
import { getRepositoryLink } from "./helpers/get-repository-link";

interface InitOptions {
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init a Docker Compose")
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

    const { initDocker } = await import("./helpers/init-docker");
    const initResult = await initDocker(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    const { imageConfigs, connectionConfigs } = initResult.value;

    logger.break();
    logger.success("Docker Compose file created.");
    logger.info(
      "You can now run `docker compose up` to start your Docker Compose."
    );
    logger.break();

    logger.info("Connection strings:");
    for (const config of connectionConfigs) {
      const connectionString = generateConnectionString(config);
      logger.info(`- ${config.type.toUpperCase()}_URL=${connectionString}`);
    }

    logger.break();
    logger.info(
      "Check out the Docker Image documentation to learn more about how to use it."
    );

    for (const { repository, namespace } of imageConfigs) {
      const repositoryLink = getRepositoryLink(repository, namespace);
      logger.info(`- ${repository}: ${repositoryLink}`);
    }

    logger.break();
  });

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok({
    cwd: options.cwd,
  });
}
