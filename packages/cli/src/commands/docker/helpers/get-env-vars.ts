import {
  type ConnectionConfig,
  generateConnectionString,
} from "./generate-connection-string";

export function getEnvVars(config: ConnectionConfig): Record<string, string> {
  const prefix = config.type.toUpperCase();
  const url = generateConnectionString(config);

  switch (config.type) {
    case "postgresql":
    case "mysql":
    case "mariadb":
    case "mongodb":
    case "redis":
    case "valkey":
    case "rabbitmq":
      return { [`${prefix}_URL`]: url };

    case "minio":
      return {
        [`${prefix}_URL`]: url,
        [`${prefix}_ACCESS_KEY`]: config.user,
        [`${prefix}_SECRET_KEY`]: config.password,
      };

    case "mailpit":
      return {
        [`${prefix}_URL`]: url,
        [`${prefix}_UI_URL`]: `http://${config.host}:${config.uiPort}`,
      };

    default: {
      const _exhaustive: never = config;
      return _exhaustive;
    }
  }
}

export function getAllEnvVars(
  configs: ConnectionConfig[]
): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const config of configs) {
    const configVars = getEnvVars(config);
    Object.assign(vars, configVars);
  }

  return vars;
}
