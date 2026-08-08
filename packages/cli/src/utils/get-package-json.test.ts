import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { getPackageJson } from "./get-package-json";

const temporaryDirectories: string[] = [];

describe(getPackageJson, () => {
  afterEach(async () => {
    await Promise.all(
      temporaryDirectories.splice(0).map(async (directory) => {
        await rm(directory, { force: true, recursive: true });
      })
    );
  });

  async function writePackageJson(content: string) {
    const directory = await mkdtemp(
      path.join(tmpdir(), "ayanokoji-package-json-")
    );
    temporaryDirectories.push(directory);
    await writeFile(path.join(directory, "package.json"), content);
    return directory;
  }

  test("reads a package JSON object with string scripts", async () => {
    const directory = await writePackageJson(
      JSON.stringify({ name: "example", scripts: { test: "vitest" } })
    );

    const result = await getPackageJson(directory);

    expect(result.isOk()).toBeTruthy();
    if (result.isErr()) {
      return;
    }

    expect(result.value.scripts).toStrictEqual({ test: "vitest" });
  });

  test.each([
    ["a JSON primitive", "null"],
    ["an invalid scripts value", JSON.stringify({ scripts: 42 })],
    ["malformed JSON", "{invalid"],
  ])("rejects %s", async (_description, content) => {
    const directory = await writePackageJson(content);

    const result = await getPackageJson(directory);

    expect(result.isErr()).toBeTruthy();
  });
});
