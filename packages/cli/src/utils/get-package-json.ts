import type { PackageJson } from "~/@types/package-json";
import { readFile } from "./fs";
import { Err, Ok } from "./result";

export async function getPackageJson(cwd: string) {
  const fileResult = await readFile<string>(`${cwd}/package.json`, "utf-8");

  if (fileResult.isErr()) {
    return new Err("Could not read package.json file.");
  }

  return new Ok(JSON.parse(fileResult.value) as PackageJson);
}
