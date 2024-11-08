import { access, writeFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";
import type { InitOptions } from "../init";
import { gitIgnoreFile } from "./git-ignore-file";

export async function initGitIgnore(options: InitOptions) {
  if (await access(`${options.cwd}/.gitignore`)) {
    return new Err(".gitignore file already exists.");
  }

  const writeFileResult = await writeFile(
    `${options.cwd}/.gitignore`,
    gitIgnoreFile
  );

  if (writeFileResult.isErr()) {
    return new Err("Failed to write .gitignore file.");
  }

  return new Ok(null);
}
