import { enhancedConfirm } from "~/utils/prompts";
import { getFormatterConfig } from "./get-formatter-config";

export async function getBiomeConfig() {
  const organizeImports = await enhancedConfirm({
    message: "Would you like to organize imports?",
    initialValue: true,
  });

  const { formatter, indentStyle } = await getFormatterConfig();

  const linter = await enhancedConfirm({
    message: "Would you like to lint the code?",
    initialValue: true,
  });

  return {
    organizeImports,
    formatter,
    indentStyle,
    linter,
  };
}

export type BiomeConfig = Awaited<ReturnType<typeof getBiomeConfig>>;
