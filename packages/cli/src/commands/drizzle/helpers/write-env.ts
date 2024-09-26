import { access, appendFile, readFile, writeFile } from "~/utils/fs";
import { logger } from "~/utils/logger";
import { parseEnv } from "~/utils/parse-env";
import { Err, Ok } from "~/utils/result";

function defaultEnv(url: string) {
  return `DATABASE_URL="${url}"`;
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

  const envFileResult = await readFile<string>(envPath, "utf-8");
  if (envFileResult.isErr()) {
    return new Err("Could not read the .env file.");
  }

  // TODO: Replace parseEnv with built-in Node.js function when it's stable
  const envKeys = Object.keys(parseEnv(envFileResult.value));

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
