export interface DrizzleAdapter {
  label: string;
  value: string;
  dependencies: string[] | null;
  devDependencies: string[] | null;
  client: string;
  migrate: string;
}

export const DRIZZLE_DATABASES = [
  {
    label: "Postgres",
    value: "postgresql",
    data: () => import("./postgresql").then((m) => m.data),
  },
  {
    label: "MySQL",
    value: "mysql",
    data: () => import("./mysql").then((m) => m.data),
  },
  {
    label: "SQLite",
    value: "sqlite",
    data: () => import("./sqlite").then((m) => m.data),
  },
] as const;

export type DrizzleDatabase = (typeof DRIZZLE_DATABASES)[number]["value"];
