import { access, appendFile, readFile, writeFile } from "~/utils/fs";
import { Err, Ok } from "~/utils/result";

export type EnvFileFailure =
  | { kind: "read-failure"; path: string }
  | { kind: "write-failure"; path: string }
  | { kind: "append-failure"; path: string };

export function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

export function stringifyEnvVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export async function readEnvFile(
  path: string
): Promise<
  | Ok<Record<string, string> | null, EnvFileFailure>
  | Err<Record<string, string> | null, EnvFileFailure>
> {
  const exists = await access(path);
  if (!exists) {
    return new Ok(null);
  }

  const result = await readFile<string>(path, "utf-8");
  if (result.isErr()) {
    return new Err({ kind: "read-failure", path });
  }

  return new Ok(parseEnvFile(result.value));
}

export async function writeEnvFile(
  path: string,
  vars: Record<string, string>
): Promise<Ok<null, EnvFileFailure> | Err<null, EnvFileFailure>> {
  const content = stringifyEnvVars(vars);
  const result = await writeFile(path, `${content}\n`);
  return result.isErr()
    ? new Err({ kind: "write-failure", path })
    : new Ok(null);
}

export async function appendEnvFile(
  path: string,
  vars: Record<string, string>
): Promise<Ok<null, EnvFileFailure> | Err<null, EnvFileFailure>> {
  const content = stringifyEnvVars(vars);
  const result = await appendFile(path, `\n${content}\n`);
  return result.isErr()
    ? new Err({ kind: "append-failure", path })
    : new Ok(null);
}

export async function addToGitignore(
  cwd: string,
  entry: string
): Promise<Ok<null, EnvFileFailure> | Err<null, EnvFileFailure>> {
  const gitignorePath = `${cwd}/.gitignore`;
  const exists = await access(gitignorePath);

  if (!exists) {
    const result = await writeFile(gitignorePath, `${entry}\n`);
    return result.isErr()
      ? new Err({ kind: "write-failure", path: gitignorePath })
      : new Ok(null);
  }

  const result = await readFile<string>(gitignorePath, "utf-8");
  if (result.isErr()) {
    return new Err({ kind: "read-failure", path: gitignorePath });
  }

  const lines = result.value.split("\n").map((line) => line.trim());
  if (lines.includes(entry)) {
    return new Ok(null);
  }

  const appendResult = await appendFile(gitignorePath, `\n${entry}\n`);
  return appendResult.isErr()
    ? new Err({ kind: "append-failure", path: gitignorePath })
    : new Ok(null);
}
