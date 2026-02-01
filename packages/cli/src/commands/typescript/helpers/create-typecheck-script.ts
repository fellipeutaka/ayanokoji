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
    .filter(([scriptName]) => !packageJson.scripts?.[scriptName])
    .map(([scriptName, scriptCommand]) => ({
      scriptName,
      scriptCommand,
    }));

  if (scriptsToAdd.length === 0) {
    return;
  }

  const newScripts = scriptsToAdd.reduce(
    (acc, { scriptName, scriptCommand }) => {
      acc[scriptName] = scriptCommand;
      return acc;
    },
    packageJson.scripts ?? {}
  );

  packageJson.scripts = newScripts;

  await writeFile(`${cwd}/package.json`, JSON.stringify(packageJson, null, 2));
}
