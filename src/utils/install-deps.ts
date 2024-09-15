import { execa } from "execa";
import { getPackageManager } from "./get-package-manager";
import type { DistinctArray } from "~/@types/array";

interface InstallDepsProps<
  Dependencies extends string[],
  DevDependencies extends string[],
> {
  cwd: string;
  dependencies?: DistinctArray<Dependencies>;
  devDependencies?: DistinctArray<DevDependencies>;
}

export async function installDeps<
  const Dependencies extends string[],
  const DevDependencies extends string[],
>({
  cwd,
  dependencies,
  devDependencies,
}: InstallDepsProps<Dependencies, DevDependencies>) {
  const packageManager = await getPackageManager(cwd);

  if (dependencies && dependencies.length > 0) {
    await execa(
      packageManager,
      [packageManager === "npm" ? "install" : "add", ...dependencies],
      {
        cwd,
      }
    );
  }

  if (devDependencies && devDependencies.length > 0) {
    await execa(
      packageManager,
      [packageManager === "npm" ? "install" : "add", ...devDependencies, "-D"],
      {
        cwd,
      }
    );
  }
}
