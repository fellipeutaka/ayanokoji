export interface DrizzleAdapter {
  label: string;
  value: string;
  dependencies: string[] | null;
  devDependencies: string[] | null;
  client: string;
  migrate: string;
}

export const DRIZZLE_DATABASE_VALUES = [
  "postgresql",
  "mysql",
  "sqlite",
] as const;

export const DRIZZLE_DATABASES = [
  {
    data: async () => await import("./postgresql").then((m) => m.data),
    label: "PostgreSQL",
    value: DRIZZLE_DATABASE_VALUES[0],
  },
  {
    data: async () => await import("./mysql").then((m) => m.data),
    label: "MySQL",
    value: DRIZZLE_DATABASE_VALUES[1],
  },
  {
    data: async () => await import("./sqlite").then((m) => m.data),
    label: "SQLite",
    value: DRIZZLE_DATABASE_VALUES[2],
  },
] as const;

export type DrizzleDatabase = (typeof DRIZZLE_DATABASES)[number]["value"];
