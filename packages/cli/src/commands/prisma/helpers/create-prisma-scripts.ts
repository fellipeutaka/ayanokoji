import type { PackageJson } from "type-fest";
import { writeFile } from "~/utils/fs";

const scripts = {
  "db:generate": "prisma generate",
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:seed": "prisma seed",
  "db:pull": "prisma db pull",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:check": "prisma validate",
} as const;

interface CreatePrismaScriptsProps {
  cwd: string;
  packageJson: PackageJson;
}

export async function createPrismaScripts({
  cwd,
  packageJson,
}: CreatePrismaScriptsProps) {
  const scriptsToAdd = Object.entries(scripts)
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
