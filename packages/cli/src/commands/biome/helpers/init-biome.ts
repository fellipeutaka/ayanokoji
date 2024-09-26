import { access, writeFile } from "~/utils/fs";
import { getPackageJson } from "~/utils/get-package-json";
import { getPackageManager } from "~/utils/get-package-manager";
import { installDeps } from "~/utils/install-deps";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { getBiomeConfig } from "./get-biome-config";
import { getBiomeConfigFile } from "./get-biome-config-file";

export async function initBiome(options: InitOptions) {
  if (await access(`${options.cwd}/biome.json`)) {
    return new Err("Biome file already exists.");
  }

  const config = await getBiomeConfig();

  if (config.installDeps) {
    const { spinner } = await import("@clack/prompts");
    const s = spinner();
    s.start("Installing dependencies");

    const packageJson = await getPackageJson(options.cwd);
    if (packageJson.isErr()) {
      return new Err(packageJson.error);
    }

    const packageManager = await getPackageManager(options.cwd);
    await installDeps({
      cwd: options.cwd,
      packageManager: packageManager,
      devDependencies: ["@biomejs/biome"],
    });

    s.stop("Dependencies installed");
  }

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
