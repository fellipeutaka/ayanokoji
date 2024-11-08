import { Command } from "commander";
import { access } from "~/utils/fs";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";
import { Err, Ok } from "~/utils/result";

export interface InitOptions {
  cwd: string;
}

export const init = new Command()
  .name("init")
  .description("Init .gitignore")
  .option(
    "-c, --cwd <cwd>",
    "The working directory. Defaults to the current directory.",
    process.cwd()
  )
  .action(async (options: InitOptions) => {
    const optionsResult = await parseOptions(options);

    if (optionsResult.isErr()) {
      handleError(optionsResult.error);
    }

    const { initGitIgnore } = await import("./helpers/init-gitignore");
    const initResult = await initGitIgnore(optionsResult.value);

    if (initResult.isErr()) {
      handleError(initResult.error);
    }

    logger.break();
    logger.success(".gitignore file created.");
    logger.info(
      "Check out the .gitignore documentation to learn more about how to use it."
    );
    logger.info("https://git-scm.com/docs/gitignore");
    logger.break();
  });

async function parseOptions(options: InitOptions) {
  if (!(await access(options.cwd))) {
    return new Err(`The directory ${options.cwd} does not exist.`);
  }

  return new Ok(options);
}
