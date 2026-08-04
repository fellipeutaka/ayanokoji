import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import {
  enhancedConfirm,
  enhancedMultiselect,
  enhancedSelect,
} from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import {
  type ComposeDocument,
  type ComposeMutationFailure,
  getRemovableServiceNames,
  removeServices,
} from "./helpers/compose-document";
import {
  type ComposeFileName,
  discoverComposeFiles,
  readComposeDocument,
  writeComposeDocument,
} from "./helpers/compose-file-adapter";
import { readEnvFile, writeEnvFile } from "./helpers/env-file";
import { formatComposeFileFailure } from "./helpers/format-compose-file-failure";
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

    const discoveryResult = await discoverComposeFiles(options.cwd);

    if (discoveryResult.isErr()) {
      handleError(formatComposeFileFailure(discoveryResult.error));
      return;
    }

    const candidates = discoveryResult.value;
    const firstCandidate = candidates[0];
    if (!firstCandidate) {
      handleError(
        formatComposeFileFailure({
          kind: "missing-document",
          fileName: "compose.yaml",
        })
      );
      return;
    }

    const existingFile: ComposeFileName =
      candidates.length === 1
        ? firstCandidate
        : await enhancedSelect({
            message: "Which Docker Compose file would you like to use?",
            options: candidates.map((value) => ({
              value,
              label: value,
            })),
            initialValue: firstCandidate,
          });

    const fileResult = await readComposeDocument(options.cwd, existingFile);
    if (fileResult.isErr()) {
      handleError(formatComposeFileFailure(fileResult.error));
      return;
    }

    const config: ComposeDocument = fileResult.value.document;
    const servicesResult = getRemovableServiceNames(config);

    if (servicesResult.isErr()) {
      handleError(formatComposeMutationFailure(servicesResult.error));
      return;
    }

    const services = servicesResult.value;

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

    const writeResult = await writeComposeDocument(
      options.cwd,
      existingFile,
      mutationResult.value,
      fileResult.value.revision
    );
    if (writeResult.isErr()) {
      handleError(formatComposeFileFailure(writeResult.error));
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
    case "no-services":
      return "No services found in the compose file.";
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
