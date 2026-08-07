export const PRISMA_DATABASE_VALUES = [
  "postgresql",
  "mysql",
  "sqlite",
  "mongodb",
  "sqlserver",
  "cockroachdb",
] as const;

export const PRISMA_DATABASES = [
  {
    label: "PostgreSQL",
    value: PRISMA_DATABASE_VALUES[0],
  },
  {
    label: "MySQL",
    value: PRISMA_DATABASE_VALUES[1],
  },
  {
    label: "SQLite",
    value: PRISMA_DATABASE_VALUES[2],
  },
  {
    label: "MongoDB",
    value: PRISMA_DATABASE_VALUES[3],
  },
  {
    label: "SQL Server",
    value: PRISMA_DATABASE_VALUES[4],
  },
  {
    label: "Cockroach",
    value: PRISMA_DATABASE_VALUES[5],
  },
] as const satisfies { label: string; value: string }[];

export type PrismaDatabase = (typeof PRISMA_DATABASES)[number]["value"];
