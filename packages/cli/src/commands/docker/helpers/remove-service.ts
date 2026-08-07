const ENV_VAR_PREFIXES: Record<string, string[]> = {
  mailpit: ["MAILPIT_URL", "MAILPIT_UI_URL"],
  mariadb: ["MARIADB_URL"],
  minio: ["MINIO_URL", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY"],
  mongo: ["MONGODB_URL"],
  mongodb: ["MONGODB_URL"],
  mysql: ["MYSQL_URL"],
  postgres: ["POSTGRESQL_URL"],
  postgresql: ["POSTGRESQL_URL"],
  rabbitmq: ["RABBITMQ_URL"],
  redis: ["REDIS_URL"],
  valkey: ["VALKEY_URL"],
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
