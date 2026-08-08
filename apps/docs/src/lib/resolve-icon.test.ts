// oxlint-disable vitest/no-import-node-test vitest/prefer-importing-vitest-globals
import { strictEqual } from "node:assert/strict";
import { test } from "node:test";

import { resolveIcon } from "./resolve-icon";

function Check() {
  return null;
}

const icons = { Check };

void test("returns undefined when an icon is missing or unknown", () => {
  strictEqual(resolveIcon(undefined, icons), undefined);
  strictEqual(resolveIcon("", icons), undefined);
  strictEqual(resolveIcon("Missing", icons), undefined);
});

void test("creates an element for a known icon", () => {
  strictEqual(resolveIcon("Check", icons)?.type, Check);
});
