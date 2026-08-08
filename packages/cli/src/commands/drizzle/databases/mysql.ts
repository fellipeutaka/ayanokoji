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
    client: `import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

const client = new Client({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(client);
`,
    dependencies: ["@planetscale/database"],
    devDependencies: null,
    label: "PlanetScale",
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
    value: "planetscale",
  },
  {
    client: `import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);
`,
    dependencies: ["mysql2"],
    devDependencies: null,
    label: "mysql2",
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
    value: "mysql2",
  },
  {
    client: `import { connect } from "@tidbcloud/serverless";
import { drizzle } from "drizzle-orm/tidb-serverless";

const client = connect({ url: process.env.DATABASE_URL! });

export const db = drizzle(client);
`,
    dependencies: ["@tidbcloud/serverless"],
    devDependencies: null,
    label: "TiDB Serverless",
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
    value: "tidb-serverless",
  },
] as const satisfies DrizzleAdapter[];

export const data = {
  adapters: DRIZZLE_MYSQL_ADAPTERS,
  defaultUrl: DRIZZLE_MYSQL_DEFAULT_URL,
  schema: DRIZZLE_MYSQL_SCHEMA,
};
