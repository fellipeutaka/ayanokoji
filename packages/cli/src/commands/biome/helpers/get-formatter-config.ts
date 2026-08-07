import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";

export async function getFormatterConfig() {
  const formatter = await enhancedConfirm({
    initialValue: true,
    message: "Would you like to format the code?",
  });

  if (formatter) {
    const indentStyle = await enhancedSelect({
      initialValue: "space",
      message: "Would you like to use spaces or tabs?",
      options: [
        { label: "Spaces", value: "space" },
        { label: "Tabs", value: "tab" },
      ],
    });

    return {
      formatter,
      indentStyle,
    };
  }

  return {
    formatter,
    indentStyle: null,
  };
}
