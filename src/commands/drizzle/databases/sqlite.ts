import type { DrizzleAdapter } from ".";

const DRIZZLE_SQLITE_DEFAULT_URL = "./dev.db";

const DRIZZLE_SQLITE_SCHEMA = `import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
});
`;

const DRIZZLE_SQLITE_ADAPTERS = [
  {
    label: "Turso",
    value: "turso",
    dependencies: ["@libsql/client"],
    devDependencies: null,
    client: `import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const client = createClient({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client);
`,
    migrate: `import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = createClient({
    url: process.env.DATABASE_URL!,
    concurrency: 1,
  });

  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "drizzle" });

  const end = Date.now();

  console.info(\`✅ Migrations completed in \${end - start}ms\`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
`,
  },
  {
    label: "Cloudflare D1",
    value: "cloudflare-d1",
    dependencies: null,
    devDependencies: null,
    client: "",
    migrate: "",
  },
  {
    label: "Bun SQLite",
    value: "bun-sqlite",
    dependencies: null,
    devDependencies: ["@types/bun"],
    client: `import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database(process.env.DATABASE_URL!);

export const db = drizzle(sqlite);
`,
    migrate: `import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const sqlite = new Database(process.env.DATABASE_URL!);
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: "drizzle" });

  const end = Date.now();

  console.info(\`✅ Migrations completed in \${end - start}ms\`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
`,
  },
  // TODO: Uncomment when expo-sqlite is released
  // {
  //   label: "Expo SQLite",
  //   value: "expo-sqlite",
  //   dependencies: ["expo-sqlite@next"],
  //   devDependencies: null,
  //   client: "",
  //   migrate: "",
  // },
  // TODO: Uncomment when op-sqlite is released
  // {
  //   label: "OP SQLite",
  //   value: "op-sqlite",
  //   dependencies: ["@op-engineering/op-sqlite"],
  //   devDependencies: null,
  //   client: "",
  //   migrate: "",
  // },
  {
    label: "better-sqlite3",
    value: "better-sqlite3",
    dependencies: ["better-sqlite3"],
    devDependencies: ["@types/better-sqlite3"],
    client: `import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database(process.env.DATABASE_URL!);

export const db = drizzle(sqlite);
`,
    migrate: `import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const sqlite = new Database(process.env.DATABASE_URL!);
  const db = drizzle(sqlite);
  migrate(db, { migrationsFolder: "drizzle" });

  const end = Date.now();

  console.info(\`✅ Migrations completed in \${end - start}ms\`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed");
  console.error(err);
  process.exit(1);
});
`,
  },
] as const satisfies DrizzleAdapter[];

export const data = {
  adapters: DRIZZLE_SQLITE_ADAPTERS,
  schema: DRIZZLE_SQLITE_SCHEMA,
  defaultUrl: DRIZZLE_SQLITE_DEFAULT_URL,
};
