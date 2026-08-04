import { Command } from "commander";
import { access, readFile, writeFile } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { enhancedConfirm, enhancedMultiselect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import {
  type ComposeDocument,
  type ComposeMutationFailure,
  getServiceNames,
  removeServices,
} from "./helpers/compose-document";
import { readEnvFile, writeEnvFile } from "./helpers/env-file";
import { getExistingDockerComposeFile } from "./helpers/get-existing-docker-compose-file";
import { getEnvVarKeysForService } from "./helpers/remove-service";

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

    let config: ComposeDocument;
    try {
      config = parse(fileResult.value) as ComposeDocument;
    } catch {
      handleError(`Failed to parse ${existingFile}`);
      return;
    }

    const services = getServiceNames(config);

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
    const mutationResult = removeServices(config, servicesToRemove);
    if (mutationResult.isErr()) {
      handleError(formatComposeMutationFailure(mutationResult.error));
      return;
    }

    // Write updated compose file
    let serializedConfig: string;
    try {
      serializedConfig = stringify(mutationResult.value, null, 2);
    } catch {
      handleError(`Failed to serialize ${existingFile}`);
      return;
    }

    const writeResult = await writeFile(
      `${options.cwd}/${existingFile}`,
      serializedConfig
    );
    if (writeResult.isErr()) {
      handleError(`Failed to write ${existingFile}`);
      return;
    }

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

function formatComposeMutationFailure(failure: ComposeMutationFailure): string {
  switch (failure.kind) {
    case "empty-service-batch":
      return "No Docker services were selected.";
    case "invalid-document":
      return `The Docker Compose document has an invalid ${failure.field} collection.`;
    case "invalid-service-entry":
      return `The Docker service selection at position ${failure.index + 1} is invalid.`;
    case "service-name-conflict":
      return `The Docker service name "${failure.serviceName}" appears more than once in the requested batch.`;
    case "service-not-found":
      return `The Docker service "${failure.serviceName}" was not found in the Compose document.`;
    case "service-dependency-conflict":
      return `Cannot remove "${failure.dependencyName}" because the remaining service "${failure.serviceName}" depends on it.`;
    default:
      return "The Docker service selection could not be applied.";
  }
}
