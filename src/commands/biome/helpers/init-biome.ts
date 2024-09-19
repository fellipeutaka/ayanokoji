import { access, writeFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { getBiomeConfig } from "./get-biome-config";
import { getBiomeConfigFile } from "./get-biome-config-file";

export async function initBiome(options: InitOptions) {
  if (await access(`${options.cwd}/biome.json`)) {
    return new Err("Biome file already exists.");
  }

  const config = await getBiomeConfig();

  const configFile = getBiomeConfigFile(config);

  const writeFileResult = await writeFile(
    `${options.cwd}/biome.json`,
    JSON.stringify(configFile, null, 2)
  );

  if (writeFileResult.isErr()) {
    return new Err("Failed to write Biome file.");
  }

  return new Ok(null);
}
