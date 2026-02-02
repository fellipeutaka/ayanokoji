import type { ComposeService } from "../databases";

interface ComposeConfig {
  services: Record<string, ComposeService>;
  volumes?: Record<string, object>;
}

export function getServices(config: ComposeConfig): string[] {
  return Object.keys(config.services);
}

export function removeServices(
  config: ComposeConfig,
  servicesToRemove: string[]
): ComposeConfig {
  const newConfig: ComposeConfig = {
    services: { ...config.services },
    volumes: config.volumes ? { ...config.volumes } : undefined,
  };

  // Collect volumes used by services being removed
  const volumesToRemove = new Set<string>();

  for (const serviceName of servicesToRemove) {
    const service = newConfig.services[serviceName];
    if (service?.volumes) {
      for (const volume of service.volumes) {
        const volumeName = volume.split(":")[0];
        if (volumeName) {
          volumesToRemove.add(volumeName);
        }
      }
    }
    delete newConfig.services[serviceName];
  }

  // Check if any remaining service uses the volumes
  const remainingVolumes = new Set<string>();
  for (const service of Object.values(newConfig.services)) {
    if (service.volumes) {
      for (const volume of service.volumes) {
        const volumeName = volume.split(":")[0];
        if (volumeName) {
          remainingVolumes.add(volumeName);
        }
      }
    }
  }

  // Remove orphaned volumes
  if (newConfig.volumes) {
    for (const volumeName of volumesToRemove) {
      if (!remainingVolumes.has(volumeName)) {
        delete newConfig.volumes[volumeName];
      }
    }

    // Remove volumes key if empty
    if (Object.keys(newConfig.volumes).length === 0) {
      newConfig.volumes = undefined;
    }
  }

  return newConfig;
}

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
