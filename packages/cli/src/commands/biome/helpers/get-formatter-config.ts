import { enhancedConfirm, enhancedSelect } from "~/utils/prompts";

export async function getFormatterConfig() {
  const formatter = await enhancedConfirm({
    message: "Would you like to format the code?",
    initialValue: true,
  });

  if (formatter) {
    const indentStyle = await enhancedSelect({
      message: "Would you like to use spaces or tabs?",
      options: [
        { value: "space", label: "Spaces" },
        { value: "tab", label: "Tabs" },
      ],
      initialValue: "space",
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
