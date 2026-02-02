import { Command } from "commander";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { enhancedConfirm, enhancedMultiselect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import { readEnvFile, writeEnvFile } from "./helpers/env-file";
import { getExistingDockerComposeFile } from "./helpers/get-existing-docker-compose-file";
import {
  getEnvVarKeysForService,
  getServices,
  removeServices,
} from "./helpers/remove-service";

interface RemoveOptions {
  cwd: string;
  envPath?: string;
}

export const remove = new Command()
  .name("remove")
  .description("Remove services from Docker Compose")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .option("--env-path <path>", "Custom path for .env file")
  .action(async (options: RemoveOptions) => {
    const optionsResult = await parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const { parse, stringify } = await import("yaml");

    // Find existing compose file
    const existingFile = await getExistingDockerComposeFile(options.cwd);

    if (!existingFile) {
      handleError("No Docker Compose file found.");
      return;
    }

    // Read compose file
    const fileResult = await readFile<string>(
      `${options.cwd}/${existingFile}`,
      "utf-8"
    );

    if (fileResult.isErr()) {
      handleError(`Failed to read ${existingFile}`);
      return;
    }

    const config = parse(fileResult.value) || { services: {} };
    const services = getServices(config);

    if (services.length === 0) {
      handleError("No services found in the compose file.");
      return;
    }

    // Select services to remove
    const servicesToRemove = await enhancedMultiselect({
      message: "Select services to remove",
      options: services.map((name) => ({
        label: name,
        value: name,
      })),
      required: true,
    });

    // Remove services
    const newConfig = removeServices(config, servicesToRemove);

    // Write updated compose file
    await writeFile(
      `${options.cwd}/${existingFile}`,
      stringify(newConfig, null, 2)
    );

    logger.success(
      `Removed ${servicesToRemove.length} service(s) from ${existingFile}`
    );
    for (const name of servicesToRemove) {
      logger.info(`  - ${name}`);
    }

    // Handle .env cleanup
    const envPath = options.envPath ?? `${options.cwd}/.env`;
    const existingEnvVars = await readEnvFile(envPath);

    if (existingEnvVars) {
      // Collect env vars to potentially remove
      const envVarsToRemove: string[] = [];

      for (const serviceName of servicesToRemove) {
        const keys = getEnvVarKeysForService(serviceName);
        for (const key of keys) {
          if (key in existingEnvVars) {
            envVarsToRemove.push(key);
          }
        }
      }

      if (envVarsToRemove.length > 0) {
        logger.break();
        logger.info("Found related environment variables:");
        for (const key of envVarsToRemove) {
          logger.info(`  - ${key}`);
        }

        const removeEnvVars = await enhancedConfirm({
          message: "Remove these environment variables from .env?",
          initialValue: true,
        });

        if (removeEnvVars) {
          const newEnvVars = { ...existingEnvVars };
          for (const key of envVarsToRemove) {
            delete newEnvVars[key];
          }

          await writeEnvFile(envPath, newEnvVars);
          logger.success(
            `Removed ${envVarsToRemove.length} env var(s) from .env`
          );
        }
      }
    }

    logger.break();
  });

async function parseOptions(options: RemoveOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok({
    cwd: options.cwd,
  });
}
