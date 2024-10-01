import { spinner } from "@clack/prompts";
import { access, rm } from "~/utils/fs";
import { getPackageJson } from "~/utils/get-package-json";
import { getPackageManager } from "~/utils/get-package-manager";
import { removeDeps } from "~/utils/remove-deps";
import { Err, Ok } from "~/utils/result";
import type { RemoveOptions } from "../remove";

export async function removeBiome(options: RemoveOptions) {
  const biomeConfigPath = `${options.cwd}/biome.json`;

  if (!(await access(biomeConfigPath))) {
    return new Err("Biome file does not exist.");
  }

  const configSpinner = spinner();
  configSpinner.start("Removing Biome file");
  const removeResult = await rm(biomeConfigPath);

  if (removeResult.isErr()) {
    configSpinner.stop("Failed to remove Biome file");
    return new Err("Failed to remove Biome file.");
  }

  configSpinner.stop("Biome file removed");

  const packageJson = await getPackageJson(options.cwd);
  if (packageJson.isOk()) {
    const depsSpinner = spinner();
    depsSpinner.start("Removing dependencies");

    const packageManager = await getPackageManager(options.cwd);

    await removeDeps({
      cwd: options.cwd,
      packageManager: packageManager,
      dependencies: ["@biomejs/biome"],
    });

    depsSpinner.stop("Dependencies removed");
  }

  return new Ok(null);
}
