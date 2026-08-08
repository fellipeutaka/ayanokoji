import { Command } from "commander";

import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

import {
  addToGitignore,
  appendEnvFile,
  readEnvFile,
  writeEnvFile,
} from "./helpers/env-file";
import { formatEnvironmentSyncFailure } from "./helpers/format-environment-failure";
import { generateConnectionString } from "./helpers/generate-connection-string";
import { getAllEnvVars } from "./helpers/get-env-vars";
import { getRepositoryLink } from "./helpers/get-repository-link";

interface InitOptions {
  cwd: string;
  envPath?: string;
  skipConflicts: boolean;
}

export const init = new Command()
  .name("init")
  .description("Init a Docker Compose")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .option("--env-path <path>", "Custom path for .env file")
  .option("--skip-conflicts", "Skip existing env vars without prompting", false)
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

    // Prompt for .env file generation
    const writeToEnv = await enhancedConfirm({
      initialValue: true,
      message: "Write connection strings to .env file?",
    });

    if (writeToEnv) {
      const envPath = options.envPath ?? `${optionsResult.value.cwd}/.env`;
      const newVars = getAllEnvVars(connectionConfigs);
      const existingVarsResult = await readEnvFile(envPath);
      if (existingVarsResult.isErr()) {
        handleError(formatEnvironmentSyncFailure(existingVarsResult.error));
      }

      const existingVars = existingVarsResult.value;

      if (existingVars === null) {
        // No existing .env, create new one
        const writeResult = await writeEnvFile(envPath, newVars);
        if (writeResult.isErr()) {
          handleError(formatEnvironmentSyncFailure(writeResult.error));
        }

        logger.success(`Created ${envPath}`);
        for (const key of Object.keys(newVars)) {
          logger.info(`  + ${key}`);
        }
      } else {
        // Existing .env, handle conflicts
        const varsToWrite: Record<string, string> = {};
        const skipped: string[] = [];

        for (const [key, value] of Object.entries(newVars)) {
          if (key in existingVars) {
            if (options.skipConflicts) {
              skipped.push(key);
              continue;
            }

            // Preserve prompt order so each conflict decision remains deterministic.
            // oxlint-disable-next-line no-await-in-loop
            const action = await enhancedSelect({
              initialValue: "skip",
              message: `${key} already exists. What do you want to do?`,
              options: [
                { label: "Skip (keep existing)", value: "skip" },
                { label: "Override (use new value)", value: "override" },
              ],
            });

            if (action === "override") {
              varsToWrite[key] = value;
            } else {
              skipped.push(key);
            }
          } else {
            varsToWrite[key] = value;
          }
        }

        if (Object.keys(varsToWrite).length > 0) {
          const appendResult = await appendEnvFile(envPath, varsToWrite);
          if (appendResult.isErr()) {
            handleError(formatEnvironmentSyncFailure(appendResult.error));
          }

          logger.success(`Updated ${envPath}`);
          for (const key of Object.keys(varsToWrite)) {
            logger.info(`  + ${key}`);
          }
        }

        if (skipped.length > 0) {
          logger.info("Skipped (already exists):");
          for (const key of skipped) {
            logger.info(`  - ${key}`);
          }
        }
      }

      // Add .env to .gitignore
      const gitignoreResult = await addToGitignore(
        optionsResult.value.cwd,
        ".env"
      );
      if (gitignoreResult.isErr()) {
        handleError(formatEnvironmentSyncFailure(gitignoreResult.error));
      }
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
