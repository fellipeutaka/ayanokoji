import path from "node:path";

export function getPrismaPaths(cwd: string) {
  const folder = path.join(cwd, "prisma");
  const schema = path.join(folder, "schema.prisma");
  const env = path.join(cwd, ".env");

  return {
    folder,
    schema,
    env,
  };
}
