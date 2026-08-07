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
    data: async () => await import("./postgresql").then((m) => m.data),
    label: "PostgreSQL",
    value: "postgresql",
  },
  {
    data: async () => await import("./mysql").then((m) => m.data),
    label: "MySQL",
    value: "mysql",
  },
  {
    data: async () => await import("./sqlite").then((m) => m.data),
    label: "SQLite",
    value: "sqlite",
  },
] as const;

export type DrizzleDatabase = (typeof DRIZZLE_DATABASES)[number]["value"];
