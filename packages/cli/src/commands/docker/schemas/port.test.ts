import { expect, test } from "vitest";

import { validatePort } from "./port";

test("returns undefined for a valid port", () => {
  expect(validatePort("5432", 5432)).toBeUndefined();
});

test("returns a validation message for an invalid port", () => {
  expect(validatePort("0", 5432)).toContain("Port must be greater than 0");
});
