import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";

export interface RemoveOptions {
  cwd: string;
}

export const remove = new Command()
  .name("remove")
  .description("Remove Biome")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: RemoveOptions) => {
    const optionsResult = await parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const { removeBiome } = await import("./helpers/remove-biome");
    const removeResult = await removeBiome(optionsResult.value);

    if (removeResult.isErr()) {
      handleError(removeResult.error);
    }

    logger.break();
    logger.info("Biome has been removed from your project.");
    logger.break();
  });

async function parseOptions(options: RemoveOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
