import fs from "node:fs";

export const validDockerComposeFiles = new Set([
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
] as const);

export function getExistingDockerComposeFile(cwd: string) {
  for (const file of validDockerComposeFiles) {
    if (fs.existsSync(`${cwd}/${file}`)) {
      return file;
    }
  }

  return null;
}
