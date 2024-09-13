import type { Database } from "../databases";
import { mysqlComposeConfig } from "../databases/mysql";
import { postgresComposeConfig } from "../databases/postgres";
import type { ComposeService } from "../interfaces/compose-service";
import type { DatabaseConfig } from "../interfaces/database-config";
import type { DockerComposeConfig } from "./get-docker-compose-config";

const databaseConfigs = {
  postgres: postgresComposeConfig,
  mysql: mysqlComposeConfig,
} as const satisfies Record<
  Database,
  (config: DatabaseConfig) => ComposeService
>;

export function getDockerComposeConfigFile(
  config: DockerComposeConfig,
  dbConfig: DatabaseConfig
) {
  return {
    services: {
      [config.database.value]: databaseConfigs[config.database.value](dbConfig),
    },
  };
}

export type DockerComposeConfigFile = ReturnType<
  typeof getDockerComposeConfigFile
>;
