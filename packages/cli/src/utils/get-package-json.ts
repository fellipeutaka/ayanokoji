import type { PackageJson } from "type-fest";

import { readFile } from "./fs";
import { Err, Ok } from "./result";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function isPackageJson(value: unknown): value is PackageJson {
  return (
    isRecord(value) && (!("scripts" in value) || isStringRecord(value.scripts))
  );
}

function parsePackageJson(value: unknown): PackageJson | undefined {
  return isPackageJson(value) ? value : undefined;
}

export async function getPackageJson(cwd: string) {
  const fileResult = await readFile(`${cwd}/package.json`, "utf-8");

  if (fileResult.isErr()) {
    return new Err("Could not read package.json file.");
  }

  try {
    const packageJson = parsePackageJson(JSON.parse(fileResult.value));

    if (!packageJson) {
      return new Err("Could not parse package.json file.");
    }

    return new Ok(packageJson);
  } catch {
    return new Err("Could not parse package.json file.");
  }
}
