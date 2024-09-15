import fs from "node:fs";
import { Err, Ok } from "./result";
import type { PackageJson } from "~/@types/package-json";

export function getPackageJson(cwd: string) {
  try {
    const file = fs.readFileSync(`${cwd}/package.json`, "utf-8");

    return new Ok(JSON.parse(file) as PackageJson);
  } catch {
    return new Err("Could not read package.json file.");
  }
}
