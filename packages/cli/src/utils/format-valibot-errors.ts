import type { BaseIssue } from "valibot";

export function formatValibotErrors<TInput>(
  issues: [BaseIssue<TInput>, ...BaseIssue<TInput>[]]
) {
  return issues.map((issue) => issue.message).join("\n");
}
