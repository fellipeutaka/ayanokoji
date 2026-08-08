import type { PackageJson } from "type-fest";

import { writeFile } from "~/utils/fs";

const script = {
  "type-check": "tsc --noEmit --incremental false",
};

interface CreateDrizzleScriptsProps {
  cwd: string;
  packageJson: PackageJson;
}

export async function createTypecheckScript({
  cwd,
  packageJson,
}: CreateDrizzleScriptsProps) {
  const scriptsToAdd = Object.entries(script)
    .filter(([scriptName]) => (packageJson.scripts?.[scriptName] ?? "") === "")
    .map(([scriptName, scriptCommand]) => ({
      scriptCommand,
      scriptName,
    }));

  if (scriptsToAdd.length === 0) {
    return;
  }

  const newScripts = packageJson.scripts ?? {};
  for (const { scriptName, scriptCommand } of scriptsToAdd) {
    newScripts[scriptName] = scriptCommand;
  }

  packageJson.scripts = newScripts;

  await writeFile(`${cwd}/package.json`, JSON.stringify(packageJson, null, 2));
}
