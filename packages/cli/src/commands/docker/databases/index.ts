import type { ConnectionConfig } from "../helpers/generate-connection-string";

export interface HealthCheck {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
}

export interface ComposeService {
  image: string;
  environment?: Record<string, string>;
  command?: string[];
  ports: string[];
  volumes?: string[];
  healthcheck?: HealthCheck;
}

export interface CreateComposeServiceResult {
  name: string;
  config: ComposeService;
  connectionConfig: ConnectionConfig;
}

export const DOCKER_DATABASES = [
  {
    config: async () => await import("./postgresql").then((m) => m.config),
    label: "PostgreSQL",
    value: "postgresql",
  },
  {
    config: async () => await import("./mysql").then((m) => m.config),
    label: "MySQL",
    value: "mysql",
  },
  {
    config: async () => await import("./mariadb").then((m) => m.config),
    label: "MariaDB",
    value: "mariadb",
  },
  {
    config: async () => await import("./redis").then((m) => m.config),
    label: "Redis",
    value: "redis",
  },
  {
    config: async () => await import("./valkey").then((m) => m.config),
    label: "Valkey",
    value: "valkey",
  },
  {
    config: async () => await import("./mongodb").then((m) => m.config),
    label: "MongoDB",
    value: "mongodb",
  },
  {
    config: async () => await import("./rabbitmq").then((m) => m.config),
    label: "RabbitMQ",
    value: "rabbitmq",
  },
  {
    config: async () => await import("./minio").then((m) => m.config),
    label: "MinIO",
    value: "minio",
  },
  {
    config: async () => await import("./mailpit").then((m) => m.config),
    label: "Mailpit",
    value: "mailpit",
  },
] as const;

export type DockerDatabase = (typeof DOCKER_DATABASES)[number]["value"];
export interface DatabaseImageConfig {
  namespace?: string;
  repository: string;
  defaultPort: number;
}
