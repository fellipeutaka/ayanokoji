import path from "node:path";

export function getDrizzlePaths(cwd: string) {
  const folder = path.join(cwd, "db");
  const defaultOut = path.join(cwd, "drizzle");
  const schema = path.join(folder, "schema.ts");
  const client = path.join(folder, "index.ts");
  const migrate = path.join(folder, "migrate.ts");
  const env = path.join(cwd, ".env");
  const config = path.join(cwd, "drizzle.config.ts");

  return {
    folder,
    defaultOut,
    schema,
    client,
    migrate,
    env,
    config,
  };
}
