import spawn from "nano-spawn";

import type { PackageManager } from "./get-package-manager";
import { isDefined } from "./is-defined";

interface RemoveDepsProps {
  packageManager: PackageManager;
  cwd: string;
  dependencies: (string | null)[];
}

const removeCommand = {
  bun: "remove",
  deno: "uninstall",
  npm: "uninstall",
  pnpm: "remove",
  yarn: "remove",
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
