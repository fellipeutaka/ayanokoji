import { expect, test } from "vitest";

import { formatComposeFileFailure } from "./format-compose-file-failure";

test("requires an explicit rerun after a stale Compose document failure", () => {
  expect(
    formatComposeFileFailure({
      fileName: "compose.yaml",
      kind: "stale-document",
    })
  ).toContain("Rerun the command explicitly");
});
