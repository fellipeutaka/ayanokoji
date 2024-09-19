import path from "node:path";
import type { PackageJson } from "~/@types/package-json";
import { writeFile } from "~/utils/fs";
import type { PackageManager } from "~/utils/get-package-manager";

const scripts = {
  npm: {
    tsx: "tsx --env-file=.env",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    "db:generate": "npm run drizzle generate",
    "db:migrate": "npm run tsx <DATABASE_PATH>/migrate.ts",
    "db:seed": "npm run tsx <DATABASE_PATH>/seed.ts",
    "db:pull": "npm run drizzle introspect",
    "db:push": "npm run drizzle push",
    "db:studio": "npm run drizzle studio",
    "db:check": "npm run drizzle check",
    "db:metadata": "npm run drizzle up",
  },
  yarn: {
    tsx: "tsx --env-file=.env",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    "db:generate": "yarn drizzle generate",
    "db:migrate": "yarn tsx <DATABASE_PATH>/migrate.ts",
    "db:seed": "yarn tsx <DATABASE_PATH>/seed.ts",
    "db:pull": "yarn drizzle introspect",
    "db:push": "yarn drizzle push",
    "db:studio": "yarn drizzle studio",
    "db:check": "yarn drizzle check",
    "db:metadata": "yarn drizzle up",
  },
  pnpm: {
    tsx: "tsx --env-file=.env",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    "db:generate": "pnpm run drizzle generate",
    "db:migrate": "pnpm run tsx <DATABASE_PATH>/migrate.ts",
    "db:seed": "pnpm run tsx <DATABASE_PATH>/seed.ts",
    "db:pull": "pnpm run drizzle introspect",
    "db:push": "pnpm run drizzle push",
    "db:studio": "pnpm run drizzle studio",
    "db:check": "pnpm run drizzle check",
    "db:metadata": "pnpm run drizzle up",
  },
  bun: {
    drizzle: "bun run ./node_modules/drizzle-kit/bin.cjs",
    "db:generate": "bun run drizzle generate",
    "db:migrate": "bun run <DATABASE_PATH>/migrate.ts",
    "db:seed": "bun run <DATABASE_PATH>/seed.ts",
    "db:pull": "bun run drizzle introspect",
    "db:push": "bun run drizzle push",
    "db:studio": "bun run drizzle studio",
    "db:check": "bun run drizzle check",
    "db:metadata": "bun run drizzle up",
  },
} as const satisfies Record<
  PackageManager,
  NonNullable<PackageJson["scripts"]>
>;

interface CreateDrizzleScriptsProps {
  cwd: string;
  folder: string;
  packageJson: PackageJson;
  packageManager: PackageManager;
}

export async function createDrizzleScripts({
  cwd,
  folder,
  packageJson,
  packageManager,
}: CreateDrizzleScriptsProps) {
  const scriptsToAdd = Object.entries(scripts[packageManager])
    .filter(([scriptName]) => !packageJson.scripts?.[scriptName])
    .map(([scriptName, scriptCommand]) => ({
      scriptName,
      scriptCommand: scriptCommand.replace(
        "<DATABASE_PATH>",
        path.relative(cwd, folder).replace(/\\/g, "/")
      ),
    }));

  if (scriptsToAdd.length === 0) {
    return;
  }

  const newScripts = scriptsToAdd.reduce(
    (acc, { scriptName, scriptCommand }) => {
      return Object.assign({}, acc, { [scriptName]: scriptCommand });
    },
    packageJson.scripts ?? {}
  );

  packageJson.scripts = newScripts;

  await writeFile(`${cwd}/package.json`, JSON.stringify(packageJson, null, 2));
}
