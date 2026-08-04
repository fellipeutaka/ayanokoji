import { writeFile } from "~/utils/fs";
import { enhancedMultiselect, enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import { type DatabaseImageConfig, DOCKER_DATABASES } from "../databases";
import {
  addServices,
  type ComposeDocument,
  type ComposeMutationFailure,
  type ComposeServiceEntry,
  getServiceNames,
} from "./compose-document";
import {
  COMPOSE_FILE_NAMES,
  type ComposeFileName,
  discoverComposeFiles,
  readComposeDocument,
} from "./compose-file-adapter";
import { formatComposeFileFailure } from "./format-compose-file-failure";
import type { ConnectionConfig } from "./generate-connection-string";

interface InitDockerProps {
  cwd: string;
}

export interface InitDockerResult {
  imageConfigs: DatabaseImageConfig[];
  connectionConfigs: ConnectionConfig[];
}

export async function initDocker(options: InitDockerProps) {
  const discoveryResult = await discoverComposeFiles(options.cwd);
  const { stringify } = await import("yaml");

  let config: ComposeDocument = {};
  let fileName: ComposeFileName;

  if (discoveryResult.isErr()) {
    return new Err(formatComposeFileFailure(discoveryResult.error));
  }

  const candidates = discoveryResult.value;
  if (candidates.length === 0) {
    fileName = await enhancedSelect({
      message: "What Docker Compose file name would you like to use?",
      options: COMPOSE_FILE_NAMES.map((value) => ({
        value,
        label: value,
      })),
      initialValue: "compose.yaml",
    });
  } else {
    const firstCandidate = candidates[0];
    if (!firstCandidate) {
      return new Err("No Docker Compose file found.");
    }

    fileName =
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

    const fileResult = await readComposeDocument(options.cwd, fileName);
    if (fileResult.isErr()) {
      return new Err(formatComposeFileFailure(fileResult.error));
    }

    config = fileResult.value;
  }

  const existingServices = getServiceNames(config);
  const availableDatabases = DOCKER_DATABASES.filter(
    (db) => !existingServices.includes(db.value)
  );

  if (availableDatabases.length === 0) {
    return new Err("All supported databases are already in the compose file.");
  }

  const selectedDatabases = await enhancedMultiselect({
    message: "Select databases to add",
    options: availableDatabases.map((db) => ({
      label: db.label,
      value: db.value,
    })),
    required: true,
  });

  const selectedDatabaseEntries = availableDatabases.filter((db) =>
    selectedDatabases.includes(db.value)
  );

  const imageConfigs: DatabaseImageConfig[] = [];
  const connectionConfigs: ConnectionConfig[] = [];
  const serviceEntries: ComposeServiceEntry[] = [];

  for (const database of selectedDatabaseEntries) {
    const { createComposeService, imageConfig } = await database.config();
    const service = await createComposeService();

    serviceEntries.push({
      name: service.name,
      config: service.config,
    });
    imageConfigs.push(imageConfig);
    connectionConfigs.push(service.connectionConfig);
  }

  const mutationResult = addServices(config, serviceEntries);
  if (mutationResult.isErr()) {
    return new Err(formatComposeMutationFailure(mutationResult.error));
  }

  let serializedConfig: string;
  try {
    serializedConfig = stringify(mutationResult.value, null, 2);
  } catch {
    return new Err(`Failed to serialize Docker Compose file: ${fileName}`);
  }

  const writeResult = await writeFile(
    `${options.cwd}/${fileName}`,
    serializedConfig
  );
  if (writeResult.isErr()) {
    return new Err(`Failed to write Docker Compose file: ${fileName}`);
  }

  return new Ok({ imageConfigs, connectionConfigs });
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
      return `The Docker service entry at position ${failure.index + 1} is invalid.`;
    case "service-name-conflict":
      return `The Docker service name "${failure.serviceName}" already exists in the ${failure.scope === "existing-document" ? "Compose document" : "requested batch"}.`;
    default:
      return "The Docker service selection could not be applied.";
  }
}
