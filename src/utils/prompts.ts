import {
  type ConfirmOptions,
  cancel,
  confirm,
  isCancel,
  select,
} from "@clack/prompts";

export async function enhancedConfirm(
  opts: ConfirmOptions,
  cancelMessage = "Operation cancelled."
) {
  const result = await confirm(opts);
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result;
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectOptions<T extends string> {
  message: string;
  options: SelectOption<T>[];
  initialValue?: T;
}

// TODO: Remove any and improve type inference
export async function enhancedSelect<T extends string>(
  opts: SelectOptions<T>,
  cancelMessage = "Operation cancelled."
): Promise<T> {
  // biome-ignore lint/suspicious/noExplicitAny:
  const result: T | symbol = await select(opts as any);
  if (isCancel(result)) {
    cancel(cancelMessage);
    process.exit(0);
  }
  return result as T;
}
