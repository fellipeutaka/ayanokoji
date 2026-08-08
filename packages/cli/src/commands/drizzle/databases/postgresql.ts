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
    client: `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql);
`,
    dependencies: ["@neondatabase/serverless"],
    devDependencies: null,
    label: "Neon",
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
    value: "neon-postgres",
  },
  {
    client: `import { drizzle } from "drizzle-orm/xata-http";
import { getXataClient } from "./xata"; // Generated client

const xata = getXataClient();

export const db = drizzle(xata);
`,
    dependencies: ["@xata.io/client"],
    devDependencies: null,
    label: "Xata",
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
    value: "xata",
  },
  {
    client: `import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";

const client = new PGlite();

export const db = drizzle(client);
`,
    dependencies: ["@electric-sql/pglite"],
    devDependencies: null,
    label: "Pglite",
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
    value: "pglite",
  },
  {
    client: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!);

export const db = drizzle(client);
`,
    dependencies: ["postgres"],
    devDependencies: null,
    label: "Postgres.JS",
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
    value: "postgresjs",
  },
  {
    client: `import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool);
`,
    dependencies: ["pg"],
    devDependencies: ["@types/pg"],
    label: "node-postgres",
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
    value: "node-postgres",
  },
  {
    client: `import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";

export const db = drizzle(sql);
`,
    dependencies: ["@vercel/postgres"],
    devDependencies: null,
    label: "Vercel Postgres",
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
    value: "vercel-postgres",
  },
  {
    client: `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client);
`,
    dependencies: ["postgres"],
    devDependencies: null,
    label: "Supabase",
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
    value: "supabase",
  },
  {
    client: `import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { fromIni } from "@aws-sdk/credential-providers";
import { drizzle } from "drizzle-orm/aws-data-api/pg";

const rdsClient = new RDSDataClient({
  credentials: fromIni({ profile: process.env["PROFILE"] }),
  region: "us-east-1",
});

export const db = drizzle(rdsClient, {
  database: process.env["DATABASE"]!,
  secretArn: process.env["SECRET_ARN"]!,
  resourceArn: process.env["RESOURCE_ARN"]!,
});
`,
    dependencies: ["@aws-sdk/client-rds-data @aws-sdk/credential-providers"],
    devDependencies: null,
    label: "AWS Data API",
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
    value: "aws-data-api",
  },
] as const satisfies DrizzleAdapter[];

export const data = {
  adapters: DRIZZLE_POSTGRES_ADAPTERS,
  defaultUrl: DRIZZLE_POSTGRES_DEFAULT_URL,
  schema: DRIZZLE_POSTGRES_SCHEMA,
};
