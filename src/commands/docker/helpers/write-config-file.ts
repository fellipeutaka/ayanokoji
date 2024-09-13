import fs from "node:fs/promises";
import { stringify } from "yaml";
import type { DockerComposeConfigFile } from "./get-docker-compose-config-file";

interface WriteConfigFileOptions {
  cwd: string;
  fileName: string;
}

export async function writeConfigFile(
  options: WriteConfigFileOptions,
  configFile: DockerComposeConfigFile
) {
  await fs.writeFile(
    `${options.cwd}/${options.fileName}`,
    stringify(configFile, null, 2)
  );
}
