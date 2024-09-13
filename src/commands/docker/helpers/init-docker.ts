import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { getDatabaseConfig } from "./get-database-config";
import { getDockerComposeConfig } from "./get-docker-compose-config";
import { getDockerComposeConfigFile } from "./get-docker-compose-config-file";
import { getExistingDockerComposeFile } from "./get-existing-docker-compose-file";
import { writeConfigFile } from "./write-config-file";

export async function initDocker(options: InitOptions) {
  const dockerComposeFile = getExistingDockerComposeFile(options.cwd);

  if (dockerComposeFile) {
    return new Err(
      `A Docker Compose file already exists: ${dockerComposeFile}`
    );
  }

  const config = await getDockerComposeConfig();
  const dbConfig = await getDatabaseConfig();

  const configFile = getDockerComposeConfigFile(config, dbConfig);

  await writeConfigFile(
    {
      cwd: options.cwd,
      fileName: config.fileName,
    },
    configFile
  );

  return new Ok(null);
}
