import fs from "node:fs/promises";
import type { BiomeConfigFile } from "./get-biome-config-file";

export async function writeConfigFile(
  cwd: string,
  configFile: BiomeConfigFile
) {
  await fs.writeFile(`${cwd}/biome.json`, JSON.stringify(configFile, null, 2));
}
