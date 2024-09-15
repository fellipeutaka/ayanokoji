import { installDeps } from "~/utils/install-deps";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { getPrismaConfig } from "./get-prisma-config";
import { logger } from "~/utils/logger";
import { getPackageJson } from "~/utils/get-package-json";
import { createPrismaSchema } from "./create-prisma-schema";
import { spinner } from "@clack/prompts";
import { getPrismaPaths } from "./get-prisma-paths";
import { writeEnv } from "./write-env";
import { getPrismaDatabaseUrl } from "./get-prisma-database-url";
import { createPrismaScripts } from "./create-prisma-scripts";
import { access, mkdir, writeFile } from "~/utils/fs";

function handleAlreadyInitError(error: string): never {
  logger.error(error);
  logger.error("Please try again in a project that is not yet using Prisma.");
  logger.break();
  process.exit(1);
}

export async function initPrisma(options: InitOptions) {
  const paths = getPrismaPaths(options.cwd);

  if (await access(paths.folder)) {
    handleAlreadyInitError(
      "A folder called prisma already exists in your project."
    );
  }

  if (await access(paths.schema)) {
    handleAlreadyInitError(
      "A file called prisma/schema.prisma already exists in your project."
    );
  }

  const packageJson = await getPackageJson(options.cwd);
  if (packageJson.isErr()) {
    return new Err(packageJson.error);
  }

  const config = await getPrismaConfig(options);
  const prismaSchema = createPrismaSchema(config);

  await mkdir(paths.folder);

  const writeConfigFileResult = await writeFile(paths.schema, prismaSchema);
  if (writeConfigFileResult.isErr()) {
    logger.break();
    return new Err("Failed to write prisma schema file.");
  }

  const databaseUrl = getPrismaDatabaseUrl(config.database);

  const writeEnvResult = await writeEnv({
    envPath: paths.env,
    url: databaseUrl,
  });
  if (writeEnvResult.isErr()) {
    logger.break();
    return new Err(writeEnvResult.error);
  }

  if (config.addScripts) {
    await createPrismaScripts({
      cwd: options.cwd,
      packageJson: packageJson.value,
    });
  }

  const s = spinner();
  s.start("Installing dependencies");

  await installDeps({
    cwd: options.cwd,
    dependencies: ["@prisma/client"],
    devDependencies: ["prisma"],
  });

  s.stop("Dependencies installed");

  logger.break();
  logger.warn(
    "If you are using Git, make sure to add the .env file to your .gitignore."
  );

  return new Ok(null);
}
