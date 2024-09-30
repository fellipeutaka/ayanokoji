import { writeFile } from "~/utils/fs";
import { enhancedSelect } from "~/utils/prompts";
import { Err, Ok } from "~/utils/result";
import { DATABASES } from "../databases";
import type { InitOptions } from "../init";
import {
  getExistingDockerComposeFile,
  validDockerComposeFiles,
} from "./get-existing-docker-compose-file";

export async function initDocker(options: InitOptions) {
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

  const database = await enhancedSelect({
    message: "What database would you like to use?",
    options: DATABASES.map((db) => ({
      label: db.label,
      value: db,
    })),
  });

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
