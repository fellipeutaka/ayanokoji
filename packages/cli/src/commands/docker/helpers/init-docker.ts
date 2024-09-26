import { writeFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { getDatabaseConfig } from "./get-database-config";
import { getDockerComposeConfig } from "./get-docker-compose-config";
import { getDockerComposeConfigFile } from "./get-docker-compose-config-file";
import { getExistingDockerComposeFile } from "./get-existing-docker-compose-file";

export async function initDocker(options: InitOptions) {
  const dockerComposeFile = await getExistingDockerComposeFile(options.cwd);

  if (dockerComposeFile) {
    return new Err(
      `A Docker Compose file already exists: ${dockerComposeFile}`
    );
  }

  const config = await getDockerComposeConfig();
  const dbConfig = await getDatabaseConfig(config.database.value);

  const configFile = getDockerComposeConfigFile(config, dbConfig);

  const { stringify } = await import("yaml");
  await writeFile(
    `${options.cwd}/${config.fileName}`,
    stringify(configFile, null, 2)
  );

  return new Ok(config);
}
