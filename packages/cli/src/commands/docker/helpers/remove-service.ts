const ENV_VAR_PREFIXES: Record<string, string[]> = {
  postgresql: ["POSTGRESQL_URL"],
  postgres: ["POSTGRESQL_URL"],
  mysql: ["MYSQL_URL"],
  mariadb: ["MARIADB_URL"],
  redis: ["REDIS_URL"],
  valkey: ["VALKEY_URL"],
  mongodb: ["MONGODB_URL"],
  mongo: ["MONGODB_URL"],
  rabbitmq: ["RABBITMQ_URL"],
  minio: ["MINIO_URL", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"],
  mailpit: ["MAILPIT_URL", "MAILPIT_UI_URL"],
};

export function getEnvVarKeysForService(serviceName: string): string[] {
  // Try exact match first
  if (ENV_VAR_PREFIXES[serviceName]) {
    return ENV_VAR_PREFIXES[serviceName];
  }

  // Try to find by prefix (e.g., "postgres" matches "postgresql")
  for (const [key, vars] of Object.entries(ENV_VAR_PREFIXES)) {
    if (serviceName.startsWith(key) || key.startsWith(serviceName)) {
      return vars;
    }
  }

  return [];
}
