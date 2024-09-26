import { execa } from "execa";
import type { PackageManager } from "./get-package-manager";
import { isDefined } from "./is-defined";

type Dependencies = Array<string | null>;

type InstallDepsProps = {
  packageManager: PackageManager;
  cwd: string;
} & (
  | {
      dependencies: Dependencies;
      devDependencies?: Dependencies;
    }
  | {
      dependencies?: Dependencies;
      devDependencies: Dependencies;
    }
  | {
      dependencies: Dependencies;
      devDependencies: Dependencies;
    }
);

export async function installDeps({
  packageManager,
  cwd,
  dependencies,
  devDependencies,
}: InstallDepsProps) {
  if (dependencies && dependencies.length > 0) {
    await execa(
      packageManager,
      [
        packageManager === "npm" ? "install" : "add",
        ...dependencies.filter(isDefined),
      ],
      {
        cwd,
      }
    );
  }

  if (devDependencies && devDependencies.length > 0) {
    await execa(
      packageManager,
      [
        packageManager === "npm" ? "install" : "add",
        ...devDependencies.filter(isDefined),
        "-D",
      ],
      {
        cwd,
      }
    );
  }
}
