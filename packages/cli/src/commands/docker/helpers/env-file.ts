import { access, appendFile, readFile, writeFile } from "~/utils/fs";

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
): Promise<Record<string, string> | null> {
  const exists = await access(path);
  if (!exists) {
    return null;
  }

  const result = await readFile<string>(path, "utf-8");
  if (result.isErr()) {
    return null;
  }

  return parseEnvFile(result.value);
}

export async function writeEnvFile(
  path: string,
  vars: Record<string, string>
): Promise<void> {
  const content = stringifyEnvVars(vars);
  await writeFile(path, `${content}\n`);
}

export async function appendEnvFile(
  path: string,
  vars: Record<string, string>
): Promise<void> {
  const content = stringifyEnvVars(vars);
  await appendFile(path, `\n${content}\n`);
}

export async function addToGitignore(
  cwd: string,
  entry: string
): Promise<void> {
  const gitignorePath = `${cwd}/.gitignore`;
  const exists = await access(gitignorePath);

  if (!exists) {
    await writeFile(gitignorePath, `${entry}\n`);
    return;
  }

  const result = await readFile<string>(gitignorePath, "utf-8");
  if (result.isErr()) {
    return;
  }

  const lines = result.value.split("\n").map((line) => line.trim());
  if (lines.includes(entry)) {
    return;
  }

  await appendFile(gitignorePath, `\n${entry}\n`);
}
