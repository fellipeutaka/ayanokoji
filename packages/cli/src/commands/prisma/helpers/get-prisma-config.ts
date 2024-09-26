import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";
import { PRISMA_DATABASES } from "../databases";
import type { InitOptions } from "../init";

export async function getPrismaConfig(options: InitOptions) {
  const database = await enhancedSelect({
    message: "What database would you like to use?",
    options: PRISMA_DATABASES,
    initialValue: "postgres",
  });

  const withModel =
    options.withModel ??
    (await enhancedConfirm({
      message: "Would you like to create a schema example?",
      initialValue: true,
    }));

  const addScripts =
    options.withScripts ??
    (await enhancedConfirm({
      message: "Would you like to add some useful scripts to package.json?",
      initialValue: true,
    }));

  return {
    database,
    withModel,
    addScripts,
  };
}

export type PrismaConfig = Awaited<ReturnType<typeof getPrismaConfig>>;
