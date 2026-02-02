import * as z from "zod/mini";

export function formatZodErrors(error: z.core.$ZodError) {
  return z.prettifyError(error);
  // return error.issues.map((issue) => issue.message).join("\n");
}
