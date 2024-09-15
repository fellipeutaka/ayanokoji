export const DATABASES = [
  {
    label: "Postgres",
    value: "postgres",
    repositoryLink: "https://hub.docker.com/r/bitnami/postgresql",
  },
  {
    label: "MySQL",
    value: "mysql",
    repositoryLink: "https://hub.docker.com/r/bitnami/mysql",
  },
  {
    label: "Redis",
    value: "redis",
    repositoryLink: "https://hub.docker.com/r/bitnami/redis",
  },
] as const satisfies { label: string; value: string; repositoryLink: string }[];

export type Database = (typeof DATABASES)[number]["value"];
