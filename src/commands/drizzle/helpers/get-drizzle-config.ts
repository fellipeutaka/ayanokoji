import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";
import { DRIZZLE_DATABASES } from "../databases";
import type { InitOptions } from "../init";

export async function getDrizzleConfig(options: InitOptions) {
  const database = await enhancedSelect({
    message: "What database would you like to use?",
    options: DRIZZLE_DATABASES.map((db) => ({
      label: db.label,
      value: db,
    })),
  });

  const data = await database.data();

  const adapter = await enhancedSelect({
    message: "What adapter would you like to use?",
    options: data.adapters.map((adapter) => ({
      label: adapter.label,
      value: adapter,
    })),
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
    data,
    adapter,
    withModel,
    addScripts,
  };
}

export type DrizzleConfig = Awaited<ReturnType<typeof getDrizzleConfig>>;
