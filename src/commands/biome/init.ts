import fs from "node:fs";
import { Command } from "commander";
import { handleError } from "~/utils/handle-error";
import { Err, Ok } from "~/utils/result";
import { initBiome } from "./helpers/init-biome";

export interface InitOptions {
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init Biome")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: InitOptions) => {
    const optionsResult = parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const initResult = await initBiome(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }
  });

function parseOptions(options: InitOptions) {
  if (!fs.existsSync(options.cwd)) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
