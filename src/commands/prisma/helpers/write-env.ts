import { Err, Ok } from "~/utils/result";
import dotenv from "dotenv";
import { logger } from "~/utils/logger";
import { access, appendFile, readFile, writeFile } from "~/utils/fs";

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
  if (!(await access(envPath))) {
    const writeFileResult = await writeFile(envPath, defaultEnv(url));
    if (writeFileResult.isErr()) {
      return new Err(`The file ${envPath} could not be created.`);
    }

    return new Ok(null);
  }

  const envFileResult = await readFile(envPath, { encoding: "utf8" });
  if (envFileResult.isErr()) {
    return new Err("Could not read the .env file.");
  }

  const config = dotenv.parse(envFileResult.value);
  const envKeys = Object.keys(config);

  if (envKeys.includes("DATABASE_URL")) {
    logger.break();
    logger.warn(
      "The DATABASE_URL variable is already set in your .env file. Skipping"
    );
    logger.break();

    return new Ok(null);
  }

  const appendFileResult = await appendFile(
    envPath,
    `${envKeys.length > 0 ? "\n\n" : ""}# This was inserted by Ayanokoji:\n${defaultEnv(url)}`
  );
  if (appendFileResult.isErr()) {
    return new Err("Could not append to the .env file.");
  }

  return new Ok(null);
}
