import path from "node:path";

import type { PackageJson } from "type-fest";

import { writeFile } from "~/utils/fs";
import type { PackageManager } from "~/utils/get-package-manager";

const scripts = {
  bun: {
    "db:check": "bun run drizzle check",
    "db:generate": "bun run drizzle generate",
    "db:metadata": "bun run drizzle up",
    "db:migrate": "bun run <DATABASE_PATH>/migrate.ts",
    "db:pull": "bun run drizzle introspect",
    "db:push": "bun run drizzle push",
    "db:seed": "bun run <DATABASE_PATH>/seed.ts",
    "db:studio": "bun run drizzle studio",
    drizzle: "bun run ./node_modules/drizzle-kit/bin.cjs",
  },
  deno: {
    "db:check": "deno run drizzle check",
    "db:generate": "deno run drizzle generate",
    "db:metadata": "deno run drizzle up",
    "db:migrate": "deno run tsx <DATABASE_PATH>/migrate.ts",
    "db:pull": "deno run drizzle introspect",
    "db:push": "deno run drizzle push",
    "db:seed": "deno run tsx <DATABASE_PATH>/seed.ts",
    "db:studio": "deno run drizzle studio",
    drizzle: "deno --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    tsx: "tsx --env-file=.env",
  },
  npm: {
    "db:check": "npm run drizzle check",
    "db:generate": "npm run drizzle generate",
    "db:metadata": "npm run drizzle up",
    "db:migrate": "npm run tsx <DATABASE_PATH>/migrate.ts",
    "db:pull": "npm run drizzle introspect",
    "db:push": "npm run drizzle push",
    "db:seed": "npm run tsx <DATABASE_PATH>/seed.ts",
    "db:studio": "npm run drizzle studio",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    tsx: "tsx --env-file=.env",
  },
  pnpm: {
    "db:check": "pnpm run drizzle check",
    "db:generate": "pnpm run drizzle generate",
    "db:metadata": "pnpm run drizzle up",
    "db:migrate": "pnpm run tsx <DATABASE_PATH>/migrate.ts",
    "db:pull": "pnpm run drizzle introspect",
    "db:push": "pnpm run drizzle push",
    "db:seed": "pnpm run tsx <DATABASE_PATH>/seed.ts",
    "db:studio": "pnpm run drizzle studio",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    tsx: "tsx --env-file=.env",
  },
  yarn: {
    "db:check": "yarn drizzle check",
    "db:generate": "yarn drizzle generate",
    "db:metadata": "yarn drizzle up",
    "db:migrate": "yarn tsx <DATABASE_PATH>/migrate.ts",
    "db:pull": "yarn drizzle introspect",
    "db:push": "yarn drizzle push",
    "db:seed": "yarn tsx <DATABASE_PATH>/seed.ts",
    "db:studio": "yarn drizzle studio",
    drizzle: "node --env-file=.env ./node_modules/drizzle-kit/bin.cjs",
    tsx: "tsx --env-file=.env",
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
    .filter(([scriptName]) => (packageJson.scripts?.[scriptName] ?? "") === "")
    .map(([scriptName, scriptCommand]) => ({
      scriptCommand: scriptCommand.replace(
        "<DATABASE_PATH>",
        path.relative(cwd, folder).replaceAll("\\", "/")
      ),
      scriptName,
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
