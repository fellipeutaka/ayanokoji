import { Command } from "commander";
import { handleError } from "~/utils/handle-error";
import { logger } from "~/utils/logger";

export const secret = new Command()
  .name("secret")
  .description(
    "Generate a random secret that can be used for secure applications."
  )
  .action(async () => {
    const { generateSecret } = await import("./helpers/generate-secret");
    const secretResult = generateSecret();

    if (secretResult.isErr()) {
      handleError(secretResult.error);
    }

    logger.success(secretResult.value);
  });
