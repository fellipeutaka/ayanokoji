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
] as const satisfies { label: string; value: string; repositoryLink: string }[];

export type Database = (typeof DATABASES)[number]["value"];
