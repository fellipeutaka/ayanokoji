import { enhancedConfirm } from "~/utils/prompts";

import { getFormatterConfig } from "./get-formatter-config";

export async function getBiomeConfig() {
  const organizeImports = await enhancedConfirm({
    initialValue: true,
    message: "Would you like to organize imports?",
  });

  const { formatter, indentStyle } = await getFormatterConfig();

  const linter = await enhancedConfirm({
    initialValue: true,
    message: "Would you like to lint the code?",
  });

  const installDeps = await enhancedConfirm({
    initialValue: true,
    message: "Would you like to install dependencies?",
  });

  return {
    formatter,
    indentStyle,
    installDeps,
    linter,
    organizeImports,
  };
}

export type BiomeConfig = Awaited<ReturnType<typeof getBiomeConfig>>;
