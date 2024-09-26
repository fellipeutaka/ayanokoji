import { access } from "~/utils/fs";

export const validDockerComposeFiles = new Set([
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
] as const);

export async function getExistingDockerComposeFile(cwd: string) {
  for (const file of validDockerComposeFiles) {
    if (await access(`${cwd}/${file}`)) {
      return file;
    }
  }

  return null;
}
