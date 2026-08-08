import { enhancedMultiselect, enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";

import { DOCKER_DATABASES } from "../databases";
import type { DatabaseImageConfig } from "../databases";
import { addServices, getServiceNames } from "./compose-document";
import type {
  ComposeDocument,
  ComposeMutationFailure,
  ComposeServiceEntry,
} from "./compose-document";
import {
  COMPOSE_FILE_NAMES,
  discoverComposeFiles,
  readComposeDocument,
  writeComposeDocument,
} from "./compose-file-adapter";
import type {
  ComposeFileName,
  ComposeFileRevision,
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

function formatComposeMutationFailure(failure: ComposeMutationFailure): string {
  switch (failure.kind) {
    case "empty-service-batch": {
      return "No Docker services were selected.";
    }
    case "no-services": {
      return "No services found in the compose file.";
    }
    case "invalid-document": {
      return `The Docker Compose document has an invalid ${failure.field} collection.`;
    }
    case "invalid-service-entry": {
      return `The Docker service entry at position ${failure.index + 1} is invalid.`;
    }
    case "service-name-conflict": {
      return `The Docker service name "${failure.serviceName}" already exists in the ${failure.scope === "existing-document" ? "Compose document" : "requested batch"}.`;
    }
    case "service-not-found": {
      return `The Docker service "${failure.serviceName}" was not found in the Compose document.`;
    }
    case "service-dependency-conflict": {
      return `Cannot remove "${failure.dependencyName}" because the remaining service "${failure.serviceName}" depends on it.`;
    }
    default: {
      const _exhaustive: never = failure;
      return _exhaustive;
    }
  }
}

export async function initDocker(options: InitDockerProps) {
  const discoveryResult = await discoverComposeFiles(options.cwd);

  let config: ComposeDocument = {};
  let fileName: ComposeFileName;
  let revision: ComposeFileRevision | undefined;

  if (discoveryResult.isErr()) {
    return new Err(formatComposeFileFailure(discoveryResult.error));
  }

  const candidates = discoveryResult.value;
  if (candidates.length === 0) {
    fileName = await enhancedSelect({
      initialValue: "compose.yaml",
      message: "What Docker Compose file name would you like to use?",
      options: COMPOSE_FILE_NAMES.map((value) => ({
        label: value,
        value,
      })),
    });
  } else {
    const [firstCandidate] = candidates;
    if (!firstCandidate) {
      return new Err("No Docker Compose file found.");
    }

    fileName =
      candidates.length === 1
        ? firstCandidate
        : await enhancedSelect({
            initialValue: firstCandidate,
            message: "Which Docker Compose file would you like to use?",
            options: candidates.map((value) => ({
              label: value,
              value,
            })),
          });

    const fileResult = await readComposeDocument(options.cwd, fileName);
    if (fileResult.isErr()) {
      return new Err(formatComposeFileFailure(fileResult.error));
    }

    ({ document: config, revision } = fileResult.value);
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

  const databaseConfigs = await Promise.all(
    selectedDatabaseEntries.map(
      // The registry loaders return promises consumed by Promise.all.
      // oxlint-disable-next-line typescript/promise-function-async
      (database) => database.config()
    )
  );
  const imageConfigs: DatabaseImageConfig[] = [];
  const connectionConfigs: ConnectionConfig[] = [];
  const serviceEntries: ComposeServiceEntry[] = [];

  for (const { createComposeService, imageConfig } of databaseConfigs) {
    // Preserve prompt order so independent service configurations do not interleave terminal input.
    // oxlint-disable-next-line no-await-in-loop
    const service = await createComposeService();

    serviceEntries.push({
      config: service.config,
      name: service.name,
    });
    imageConfigs.push(imageConfig);
    connectionConfigs.push(service.connectionConfig);
  }

  const mutationResult = addServices(config, serviceEntries);
  if (mutationResult.isErr()) {
    return new Err(formatComposeMutationFailure(mutationResult.error));
  }

  const writeResult = await writeComposeDocument(
    options.cwd,
    fileName,
    mutationResult.value,
    revision
  );
  if (writeResult.isErr()) {
    return new Err(formatComposeFileFailure(writeResult.error));
  }

  return new Ok({ connectionConfigs, imageConfigs });
}
