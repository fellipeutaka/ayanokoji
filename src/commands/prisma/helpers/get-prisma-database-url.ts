import type { PrismaDatabase } from "../databases";

const defaultDatabaseUrl = {
  postgres: "postgresql://johndoe:password@localhost:5432/mydb?schema=public",
  cockroachdb:
    "postgresql://johndoe:password@localhost:26257/mydb?schema=public",
  mysql: "mysql://johndoe:password@localhost:3306/mydb",
  sqlserver:
    "sqlserver://localhost:1433;database=mydb;user=SA;password=password;",
  mongodb:
    "mongodb+srv://root:password@cluster0.ab1cd.mongodb.net/mydb?retryWrites=true&w=majority",
  sqlite: "file:./dev.db",
} as const satisfies Record<PrismaDatabase, string>;

export function getPrismaDatabaseUrl(database: PrismaDatabase) {
  return defaultDatabaseUrl[database];
}
