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
    label: "PostgreSQL",
    value: "postgresql",
    config: () => import("./postgresql").then((m) => m.config),
  },
  {
    label: "MySQL",
    value: "mysql",
    config: () => import("./mysql").then((m) => m.config),
  },
  {
    label: "MariaDB",
    value: "mariadb",
    config: () => import("./mariadb").then((m) => m.config),
  },
  {
    label: "Redis",
    value: "redis",
    config: () => import("./redis").then((m) => m.config),
  },
  {
    label: "Valkey",
    value: "valkey",
    config: () => import("./valkey").then((m) => m.config),
  },
  {
    label: "MongoDB",
    value: "mongodb",
    config: () => import("./mongodb").then((m) => m.config),
  },
  {
    label: "RabbitMQ",
    value: "rabbitmq",
    config: () => import("./rabbitmq").then((m) => m.config),
  },
  {
    label: "MinIO",
    value: "minio",
    config: () => import("./minio").then((m) => m.config),
  },
  {
    label: "Mailpit",
    value: "mailpit",
    config: () => import("./mailpit").then((m) => m.config),
  },
] as const;

export type DockerDatabase = (typeof DOCKER_DATABASES)[number]["value"];
export interface DatabaseImageConfig {
  namespace?: string;
  repository: string;
  defaultPort: number;
}
