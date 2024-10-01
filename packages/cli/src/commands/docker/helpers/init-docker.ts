import { writeFile } from "~/utils/fs";
import { enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import { DOCKER_DATABASES, type DockerDatabase } from "../databases";
import {
  getExistingDockerComposeFile,
  validDockerComposeFiles,
} from "./get-existing-docker-compose-file";

interface InitDockerProps {
  cwd: string;
  database?: DockerDatabase;
}

export async function initDocker(options: InitDockerProps) {
  const dockerComposeFile = await getExistingDockerComposeFile(options.cwd);

  if (dockerComposeFile) {
    return new Err(
      `A Docker Compose file already exists: ${dockerComposeFile}`
    );
  }

  const fileName = await enhancedSelect({
    message: "What Docker Compose file name would you like to use?",
    options: Array.from(validDockerComposeFiles).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "compose.yaml",
  });

  const database =
    DOCKER_DATABASES.find((db) => db.value === options.database) ??
    (await enhancedSelect({
      message: "What database would you like to use?",
      options: DOCKER_DATABASES.map((db) => ({
        label: db.label,
        value: db,
      })),
    }));

  const { createComposeService, imageConfig } = await database.config();

  const configFile = {
    services: {
      [database.value]: await createComposeService(),
    },
  };

  const { stringify } = await import("yaml");
  await writeFile(`${options.cwd}/${fileName}`, stringify(configFile, null, 2));

  return new Ok(imageConfig);
}
