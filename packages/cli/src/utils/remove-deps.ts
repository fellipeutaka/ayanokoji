import spawn from "nano-spawn";
import type { PackageManager } from "./get-package-manager";
import { isDefined } from "./is-defined";

interface RemoveDepsProps {
  packageManager: PackageManager;
  cwd: string;
  dependencies: Array<string | null>;
}

const removeCommand = {
  npm: "uninstall",
  yarn: "remove",
  pnpm: "remove",
  bun: "remove",
} as const satisfies Record<PackageManager, string>;

export async function removeDeps({
  packageManager,
  cwd,
  dependencies,
}: RemoveDepsProps) {
  return await spawn(
    packageManager,
    [removeCommand[packageManager], ...dependencies.filter(isDefined)],
    {
      cwd,
    }
  );
}
