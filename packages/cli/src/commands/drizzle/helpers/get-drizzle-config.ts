import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";

import { DRIZZLE_DATABASES } from "../databases";
import type { ParsedInitOptions } from "../init";

export async function getDrizzleConfig(options: ParsedInitOptions) {
  const database =
    DRIZZLE_DATABASES.find((db) => db.value === options.database) ??
    (await enhancedSelect({
      message: "What database would you like to use?",
      options: DRIZZLE_DATABASES.map((db) => ({
        label: db.label,
        value: db,
      })),
    }));

  const data = await database.data();

  const adapter = await enhancedSelect({
    message: "What adapter would you like to use?",
    options: data.adapters.map((adapterOption) => ({
      label: adapterOption.label,
      value: adapterOption,
    })),
  });

  const withModel =
    options.withModel ??
    (await enhancedConfirm({
      initialValue: true,
      message: "Would you like to create a schema example?",
    }));

  const addScripts =
    options.withScripts ??
    (await enhancedConfirm({
      initialValue: true,
      message: "Would you like to add some useful scripts to package.json?",
    }));

  return {
    adapter,
    addScripts,
    data,
    database,
    withModel,
  };
}

export type DrizzleConfig = Awaited<ReturnType<typeof getDrizzleConfig>>;
