import path from "node:path";
import type { DrizzleDatabase } from "../databases";

interface CreateDrizzleConfigFileProps {
  cwd: string;
  schemaPath: string;
  database: DrizzleDatabase;
}

export function createDrizzleConfigFile({
  cwd,
  schemaPath,
  database,
}: CreateDrizzleConfigFileProps) {
  const schemaPathRelative = path.relative(cwd, schemaPath).replace(/\\/g, "/");

  return `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "${database}",
  schema: "${schemaPathRelative}",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
`;
}
