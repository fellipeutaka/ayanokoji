import fs from "node:fs/promises";

import { Err, Ok } from "./result";

type ReadFilePath = Parameters<typeof fs.readFile>[0];
type ReadFileOptions = Parameters<typeof fs.readFile>[1];
type ReadFileEncoding = Extract<NonNullable<ReadFileOptions>, string>;
type ReadFileData = Awaited<ReturnType<typeof fs.readFile>>;
type ReadFileResult<Content> = Ok<Content, string> | Err<Content, string>;

export async function writeFile(
  file: Parameters<typeof fs.writeFile>[0],
  data: Parameters<typeof fs.writeFile>[1],
  options?: Parameters<typeof fs.writeFile>[2]
) {
  try {
    await fs.writeFile(file, data, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to write file.");
  }
}

export function readFile(
  path: ReadFilePath,
  options: ReadFileEncoding
): Promise<ReadFileResult<string>>;
export function readFile(
  path: ReadFilePath,
  options?: ReadFileOptions
): Promise<ReadFileResult<ReadFileData>>;
export async function readFile(
  path: ReadFilePath,
  options?: ReadFileOptions
): Promise<ReadFileResult<ReadFileData>> {
  try {
    const file = await fs.readFile(path, options);

    return new Ok<ReadFileData, string>(file);
  } catch {
    return new Err<ReadFileData, string>("Failed to read file.");
  }
}

export async function rm(
  file: Parameters<typeof fs.rm>[0],
  options?: Parameters<typeof fs.rm>[1]
) {
  try {
    await fs.rm(file, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to remove file.");
  }
}

export async function mkdir(
  path: Parameters<typeof fs.mkdir>[0],
  options?: Parameters<typeof fs.mkdir>[1]
) {
  try {
    await fs.mkdir(path, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to create directory.");
  }
}

export async function access(
  path: Parameters<typeof fs.access>[0],
  mode?: Parameters<typeof fs.access>[1]
) {
  try {
    await fs.access(path, mode);

    return true;
  } catch {
    return false;
  }
}

export async function appendFile(
  path: Parameters<typeof fs.appendFile>[0],
  data: Parameters<typeof fs.appendFile>[1],
  options?: Parameters<typeof fs.appendFile>[2]
) {
  try {
    await fs.appendFile(path, data, options);

    return new Ok(null);
  } catch {
    return new Err("Failed to append file.");
  }
}
