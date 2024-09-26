import { spinner } from "@clack/prompts";
import { access, mkdir, writeFile } from "~/utils/fs";
import { getPackageJson } from "~/utils/get-package-json";
import { getPackageManager } from "~/utils/get-package-manager";
import { installDeps } from "~/utils/install-deps";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { createDrizzleConfigFile } from "./create-drizzle-config-file";
import { createDrizzleScripts } from "./create-drizzle-scripts";
import { getDrizzleConfig } from "./get-drizzle-config";
import { getDrizzlePaths } from "./get-drizzle-paths";
import { writeEnv } from "./write-env";

function handleAlreadyInitError(error: string): never {
  logger.error(error);
  logger.error("Please try again in a project that is not yet using Drizzle.");
  logger.break();
  process.exit(1);
}

export async function initDrizzle(options: InitOptions) {
  const paths = getDrizzlePaths(options.cwd);

  if (await access(paths.config)) {
    handleAlreadyInitError(
      "A file called drizzle.config.ts already exists in your project."
    );
  }

  if (await access(paths.defaultOut)) {
    handleAlreadyInitError(
      "A folder called drizzle already exists in your project."
    );
  }

  const packageJson = await getPackageJson(options.cwd);
  if (packageJson.isErr()) {
    return new Err(packageJson.error);
  }

  const config = await getDrizzleConfig(options);

  await mkdir(paths.folder);

  const configFile = createDrizzleConfigFile({
    cwd: options.cwd,
    schemaPath: paths.schema,
    database: config.database.value,
  });
  const writeConfigFileResult = await writeFile(paths.config, configFile);
  if (writeConfigFileResult.isErr()) {
    logger.break();
    return new Err("Failed to write drizzle.config.ts file.");
  }

  if (config.withModel) {
    const writeSchemaFileResult = await writeFile(
      paths.schema,
      config.data.schema
    );
    if (writeSchemaFileResult.isErr()) {
      logger.break();
      return new Err("Failed to write Drizzle schema file.");
    }
  }

  const writeMigrateFileResult = await writeFile(
    paths.migrate,
    config.adapter.migrate
  );
  if (writeMigrateFileResult.isErr()) {
    logger.break();
    return new Err("Failed to write Drizzle migrate file.");
  }

  const writeClientFileResult = await writeFile(
    paths.client,
    config.adapter.client
  );
  if (writeClientFileResult.isErr()) {
    logger.break();
    return new Err("Failed to write Drizzle client file.");
  }

  const writeEnvResult = await writeEnv({
    envPath: paths.env,
    url: config.data.defaultUrl,
  });
  if (writeEnvResult.isErr()) {
    logger.break();
    return new Err(writeEnvResult.error);
  }

  const packageManager = await getPackageManager(options.cwd);

  if (config.addScripts) {
    await createDrizzleScripts({
      cwd: options.cwd,
      folder: paths.folder,
      packageJson: packageJson.value,
      packageManager,
    });
  }

  const s = spinner();
  s.start("Installing dependencies");

  await installDeps({
    packageManager,
    cwd: options.cwd,
    dependencies: ["drizzle-orm", ...(config.adapter.dependencies ?? [])],
    devDependencies: [
      "drizzle-kit",
      packageManager === "bun" ? null : "tsx",
      ...(config.adapter.devDependencies ?? []),
    ],
  });

  s.stop("Dependencies installed");

  logger.break();
  logger.warn(
    "If you are using Git, make sure to add the .env file to your .gitignore."
  );
  logger.break();
  logger.warn(
    "Consider replacing all occurrences of 'process.env.DATABASE_URL!' with a single source of truth for environment variables."
  );
  logger.warn(
    "Using a tool like 'T3 Env', 'Nobara', or just a schema validation library such as 'zod', 'yup', or 'valibot' ensures type safety and centralized validation."
  );
  logger.warn(
    "This helps to avoid potential issues with misconfigured or missing environment variables."
  );

  return new Ok(config);
}
