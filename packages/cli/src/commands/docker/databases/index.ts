export interface ComposeService {
  image: string;
  environment: Record<string, string>;
  ports: string[];
}

export const DATABASES = [
  {
    label: "Postgres",
    value: "postgresql",
    config: () => import("./postgres").then((m) => m.config),
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

export type Database = (typeof DATABASES)[number]["value"];
export interface DatabaseImageConfig {
  namespace: string;
  repository: string;
  defaultPort: number;
}
