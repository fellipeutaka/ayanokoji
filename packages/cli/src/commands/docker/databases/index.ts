export interface ComposeService {
  image: string;
  environment: Record<string, string>;
  ports: string[];
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
    label: "Redis",
    value: "redis",
    config: () => import("./redis").then((m) => m.config),
  },
  {
    label: "MongoDB",
    value: "mongodb",
    config: () => import("./mongodb").then((m) => m.config),
  },
] as const;

export type DockerDatabase = (typeof DOCKER_DATABASES)[number]["value"];
export interface DatabaseImageConfig {
  namespace: string;
  repository: string;
  defaultPort: number;
}
