import type { DrizzleAdapter } from ".";

const DRIZZLE_MYSQL_DEFAULT_URL =
  "mysql://johndoe:password@localhost:3306/mydb";

const DRIZZLE_MYSQL_SCHEMA = `import { mysqlTable, serial, text } from "drizzle-orm/mysql-core";

export const user = mysqlTable("users", {
  id: serial("id").primaryKey().autoincrement(),
  email: text("email").notNull().unique(),
  name: text("name"),
});
`;

const DRIZZLE_MYSQL_ADAPTERS = [
  {
    label: "PlanetScale",
    value: "planetscale",
    dependencies: ["@planetscale/database"],
    devDependencies: null,
    client: `import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

const client = new Client({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client);
`,
    migrate: `import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { migrate } from "drizzle-orm/planetscale-serverless/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = new Client({
    url: process.env.DATABASE_URL!,
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
    label: "mysql2",
    value: "mysql2",
    dependencies: ["mysql2"],
    devDependencies: null,
    client: `import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);
`,
    migrate: `import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const pool = mysql.createPool({
    uri: process.env.DATABASE_URL!,
    connectionLimit: 1,
  });

  const db = drizzle(pool);

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
    label: "TiDB Serverless",
    value: "tidb-serverless",
    dependencies: ["@tidbcloud/serverless"],
    devDependencies: null,
    client: `import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";

const client = connect({ url: process.env.DATABASE_URL! });

export const db = drizzle(client);
`,
    migrate: `import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";
import { migrate } from "drizzle-orm/tidb-serverless/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = connect({ url: process.env.DATABASE_URL! });
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
] as const satisfies DrizzleAdapter[];

export const data = {
  adapters: DRIZZLE_MYSQL_ADAPTERS,
  schema: DRIZZLE_MYSQL_SCHEMA,
  defaultUrl: DRIZZLE_MYSQL_DEFAULT_URL,
};
