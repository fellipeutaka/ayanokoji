export const PRISMA_DATABASES = [
  {
    label: "PostgreSQL",
    value: "postgresql",
  },
  {
    label: "MySQL",
    value: "mysql",
  },
  {
    label: "SQLite",
    value: "sqlite",
  },
  {
    label: "MongoDB",
    value: "mongodb",
  },
  {
    label: "SQL Server",
    value: "sqlserver",
  },
  {
    label: "Cockroach",
    value: "cockroachdb",
  },
] as const satisfies { label: string; value: string }[];

export type PrismaDatabase = (typeof PRISMA_DATABASES)[number]["value"];
