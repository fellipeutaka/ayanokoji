import type { DrizzleAdapter } from ".";

const DRIZZLE_POSTGRES_DEFAULT_URL =
  "postgresql://johndoe:password@localhost:5432/mydb?schema=public";

const DRIZZLE_POSTGRES_SCHEMA = `import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
});
`;

const DRIZZLE_POSTGRES_ADAPTERS = [
  {
    label: "Neon",
    value: "neon-postgres",
    dependencies: ["@neondatabase/serverless"],
    devDependencies: null,
    client: `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
`,
    migrate: `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);
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
    label: "Xata",
    value: "xata",
    dependencies: ["@xata.io/client"],
    devDependencies: null,
    client: `import { drizzle } from "drizzle-orm/xata-http";
import { getXataClient } from "./xata"; // Generated client

const xata = getXataClient();
const db = drizzle(xata);
`,
    migrate: `import { drizzle } from "drizzle-orm/xata-http";
import { migrate } from "drizzle-orm/xata-http/migrator";
import { getXataClient } from "./xata"; // Generated client

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const xata = getXataClient();
  const db = drizzle(xata);
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
    label: "Pglite",
    value: "pglite",
    dependencies: ["@electric-sql/pglite"],
    devDependencies: null,
    client: `import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const client = new PGlite();
const db = drizzle(client);
`,
    migrate: `import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = new PGlite();
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
    label: "Postgres.JS",
    value: "postgresjs",
    dependencies: ["postgres"],
    devDependencies: null,
    client: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);
`,
    migrate: `import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
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
    label: "node-postgres",
    value: "node-postgres",
    dependencies: ["pg"],
    devDependencies: ["@types/pg"],
    client: `import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});
const db = drizzle(pool);
`,
    migrate: `import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 1,
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
    label: "Vercel Postgres",
    value: "vercel-postgres",
    dependencies: ["@vercel/postgres"],
    devDependencies: null,
    client: `import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

const db = drizzle(sql);
`,
    migrate: `import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { migrate } from "drizzle-orm/vercel-postgres/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const db = drizzle(sql);
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
    label: "Supabase",
    value: "supabase",
    dependencies: ["postgres"],
    devDependencies: null,
    client: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);
`,
    migrate: `import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
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
    label: "AWS Data API",
    value: "aws-data-api",
    dependencies: ["@aws-sdk/client-rds-data @aws-sdk/credential-providers"],
    devDependencies: null,
    client: `import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { fromIni } from "@aws-sdk/credential-providers";
import { drizzle } from "drizzle-orm/aws-data-api/pg";

const rdsClient = new RDSDataClient({
  credentials: fromIni({ profile: process.env["PROFILE"] }),
  region: "us-east-1",
});

const db = drizzle(rdsClient, {
  database: process.env["DATABASE"]!,
  secretArn: process.env["SECRET_ARN"]!,
  resourceArn: process.env["RESOURCE_ARN"]!,
});
`,
    migrate: `import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { fromIni } from "@aws-sdk/credential-providers";
import { drizzle } from "drizzle-orm/aws-data-api/pg";
import { migrate } from "drizzle-orm/aws-data-api/pg/migrator";

async function main() {
  console.info("⏳ Running migrations...");

  const start = Date.now();

  const rdsClient = new RDSDataClient({
    credentials: fromIni({ profile: process.env["PROFILE"] }),
    region: "us-east-1",
  });

  const db = drizzle(rdsClient, {
    database: process.env["DATABASE"]!,
    secretArn: process.env["SECRET_ARN"]!,
    resourceArn: process.env["RESOURCE_ARN"]!,
  });

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
  adapters: DRIZZLE_POSTGRES_ADAPTERS,
  schema: DRIZZLE_POSTGRES_SCHEMA,
  defaultUrl: DRIZZLE_POSTGRES_DEFAULT_URL,
};
