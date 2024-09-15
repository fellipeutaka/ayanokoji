import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { Err, Ok } from "~/utils/result";
import dotenv from "dotenv";
import { logger } from "~/utils/logger";

function defaultEnv(
  url = "postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public",
  comments = true
) {
  let env = comments
    ? `# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings\n\n`
    : "";
  env += `DATABASE_URL="${url}"`;
  return env;
}

interface WriteEnvProps {
  envPath: string;
  url: string;
}

export async function writeEnv({ envPath, url }: WriteEnvProps) {
  try {
    if (!existsSync(envPath)) {
      await fs.writeFile(envPath, defaultEnv(url));

      return new Ok(null);
    }

    const envFile = await fs.readFile(envPath, { encoding: "utf8" });
    const config = dotenv.parse(envFile);
    const envKeys = Object.keys(config);

    if (envKeys.includes("DATABASE_URL")) {
      logger.break();
      logger.warn(
        "The DATABASE_URL variable is already set in your .env file. Skipping"
      );
      logger.break();

      return new Ok(null);
    }

    await fs.appendFile(
      envPath,
      `${envKeys.length > 0 ? "\n\n" : ""}# This was inserted by Ayanokoji:\n${defaultEnv(url)}`
    );

    return new Ok(null);
  } catch {
    return new Err(`The file ${envPath} could not be created.`);
  }
}
