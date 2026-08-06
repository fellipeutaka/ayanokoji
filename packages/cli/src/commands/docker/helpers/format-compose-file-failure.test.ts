import { expect, test } from "vitest";
import { formatComposeFileFailure } from "./format-compose-file-failure";

test("requires an explicit rerun after a stale Compose document failure", () => {
  expect(
    formatComposeFileFailure({
      kind: "stale-document",
      fileName: "compose.yaml",
    })
  ).toContain("Rerun the command explicitly");
});
