import { readFile, writeFile } from "~/utils/fs";
import { enhancedMultiselect, enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import {
  type ComposeService,
  type DatabaseImageConfig,
  DOCKER_DATABASES,
} from "../databases";
import type { ConnectionConfig } from "./generate-connection-string";
import {
  getExistingDockerComposeFile,
  validDockerComposeFiles,
} from "./get-existing-docker-compose-file";

interface InitDockerProps {
  cwd: string;
}

interface ComposeConfig {
  services: Record<string, ComposeService>;
  volumes?: Record<string, object>;
}

export interface InitDockerResult {
  imageConfigs: DatabaseImageConfig[];
  connectionConfigs: ConnectionConfig[];
}

export async function initDocker(options: InitDockerProps) {
  const existingFile = await getExistingDockerComposeFile(options.cwd);
  const { parse, stringify } = await import("yaml");

  let config: ComposeConfig = { services: {} };
  let fileName: string;

  if (existingFile) {
    fileName = existingFile;
    const fileResult = await readFile<string>(
      `${options.cwd}/${existingFile}`,
      "utf-8"
    );

    if (fileResult.isErr()) {
      return new Err(
        `Failed to read existing Docker Compose file: ${existingFile}`
      );
    }

    config = parse(fileResult.value) || { services: {} };
    config.services = config.services || {};
  } else {
    fileName = await enhancedSelect({
      message: "What Docker Compose file name would you like to use?",
      options: Array.from(validDockerComposeFiles).map((value) => ({
        value,
        label: value,
      })),
      initialValue: "compose.yaml",
    });
  }

  const existingServices = Object.keys(config.services);
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
  const volumes: Set<string> = new Set();

  for (const database of selectedDatabaseEntries) {
    const { createComposeService, imageConfig } = await database.config();
    const service = await createComposeService();

    config.services[service.name] = service.config;
    imageConfigs.push(imageConfig);
    connectionConfigs.push(service.connectionConfig);

    if (service.config.volumes) {
      for (const volume of service.config.volumes) {
        const volumeName = volume.split(":")[0];
        if (volumeName) {
          volumes.add(volumeName);
        }
      }
    }
  }

  if (volumes.size > 0) {
    config.volumes = config.volumes || {};
    for (const volumeName of volumes) {
      config.volumes[volumeName] = {};
    }
  }

  await writeFile(`${options.cwd}/${fileName}`, stringify(config, null, 2));

  return new Ok({ imageConfigs, connectionConfigs });
}
