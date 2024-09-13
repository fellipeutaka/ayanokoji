import type { DockerComposeConfig } from "./get-docker-compose-config";

export interface DatabaseConfig {
  version: string;
  user: string;
  password: string;
  db: string;
  port: number;
}

function postgresConfig({ version, user, db, password, port }: DatabaseConfig) {
  return {
    image: `bitnami/postgresql:${version}`,
    environment: {
      POSTGRES_USER: user,
      POSTGRES_PASSWORD: password,
      POSTGRES_DB: db,
    },
    ports: [`${port}:5432`],
  };
}

const databaseConfigs = {
  postgres: postgresConfig,
};

export function getDockerComposeConfigFile(
  config: DockerComposeConfig,
  dbConfig: DatabaseConfig
) {
  return {
    services: {
      [config.database]: databaseConfigs[config.database](dbConfig),
    },
  };
}

export type DockerComposeConfigFile = ReturnType<
  typeof getDockerComposeConfigFile
>;
