import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { checkIfBiomeFileExists } from "./check-if-biome-file-exists";
import { getBiomeConfig } from "./get-biome-config";
import { getBiomeConfigFile } from "./get-biome-config-file";
import { writeConfigFile } from "./write-config-file";

export async function initBiome(options: InitOptions) {
  if (checkIfBiomeFileExists(options.cwd)) {
    return new Err("Biome file already exists.");
  }

  const config = await getBiomeConfig();

  const configFile = getBiomeConfigFile(config);

  await writeConfigFile(options.cwd, configFile);

  return new Ok(null);
}
