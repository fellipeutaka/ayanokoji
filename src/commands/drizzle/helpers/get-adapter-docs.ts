import type { DrizzleAdapter, DrizzleDatabase } from "../databases";

export function getAdapterDocs(
  database: DrizzleDatabase,
  adapter: DrizzleAdapter
) {
  const baseUrl = "https://orm.drizzle.team/docs/get-started";

  return `${baseUrl}-${database}#${adapter.value}`;
}
