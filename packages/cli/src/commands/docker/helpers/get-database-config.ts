import { maxValue, minValue, number, pipe, string, transform } from "valibot";
import type { Database } from "../databases";
import { getMySQLConfig } from "../databases/mysql";
import { getPostgresConfig } from "../databases/postgres";
import { getRedisConfig } from "../databases/redis";
import type { DatabaseConfig } from "../interfaces/database-config";

export const portSchema = pipe(
  string(),
  transform(Number),
  number("Port must be a number"),
  minValue(0, "Port must be greater than 0"),
  maxValue(65535, "Port must be less than 65536")
);

const retrieveDatabaseConfig = {
  postgres: getPostgresConfig,
  mysql: getMySQLConfig,
  redis: getRedisConfig,
} as const satisfies Record<Database, () => Promise<DatabaseConfig>>;

export async function getDatabaseConfig(
  database: Database
): Promise<DatabaseConfig> {
  const config = retrieveDatabaseConfig[database];

  return await config();
}
