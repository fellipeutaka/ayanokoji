import type { PrismaDatabase } from "../databases";

const defaultDatabaseUrl = {
  cockroachdb:
    "postgresql://johndoe:password@localhost:26257/mydb?schema=public",
  mongodb:
    "mongodb+srv://root:password@cluster0.ab1cd.mongodb.net/mydb?retryWrites=true&w=majority",
  mysql: "mysql://johndoe:password@localhost:3306/mydb",
  postgresql: "postgresql://johndoe:password@localhost:5432/mydb?schema=public",
  sqlite: "file:./dev.db",
  sqlserver:
    "sqlserver://localhost:1433;database=mydb;user=SA;password=password;",
} as const satisfies Record<PrismaDatabase, string>;

export function getPrismaDatabaseUrl(database: PrismaDatabase) {
  return defaultDatabaseUrl[database];
}
