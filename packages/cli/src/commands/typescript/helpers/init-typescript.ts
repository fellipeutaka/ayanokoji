import { access, writeFile } from "~/utils/fs";
import { getPackageJson } from "~/utils/get-package-json";
import { getPackageManager } from "~/utils/get-package-manager";
import { installDeps } from "~/utils/install-deps";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { createTypecheckScript } from "./create-typecheck-script";
import { getTsconfigFile } from "./get-tsconfig-file";
import { getTypeScriptConfig } from "./get-typescript-config";

export async function initTypeScript(options: InitOptions) {
  const configFileName = "tsconfig.json";

  if (await access(`${options.cwd}/${configFileName}`)) {
    return new Err(`${configFileName} file already exists.`);
  }

  const [config, packageJson] = await Promise.all([
    getTypeScriptConfig(),
    getPackageJson(options.cwd),
  ]);

  if (config.depsToInstall.length > 0) {
    if (packageJson.isErr()) {
      return new Err(packageJson.error);
    }

    const { spinner } = await import("@clack/prompts");
    const s = spinner();
    s.start("Installing dependencies");

    const packageManager = await getPackageManager(options.cwd);
    await installDeps({
      cwd: options.cwd,
      packageManager: packageManager,
      devDependencies: config.depsToInstall,
    });

    s.stop("Dependencies installed");
  }

  const configFile = getTsconfigFile(config);

  const writeFileResult = await writeFile(
    `${options.cwd}/${configFileName}`,
    JSON.stringify(configFile, null, 2)
  );

  if (writeFileResult.isErr()) {
    return new Err(`Failed to write ${configFileName} file.`);
  }

  const { enhancedConfirm } = await import("~/utils/prompts");

  const addScripts = await enhancedConfirm({
    message:
      "Would you like to add a useful script to type-check your codebase in your package.json?",
    initialValue: true,
  });

  if (addScripts) {
    if (packageJson.isErr()) {
      return new Err(packageJson.error);
    }

    await createTypecheckScript({
      cwd: options.cwd,
      packageJson: packageJson.value,
    });
  }

  return new Ok(null);
}
