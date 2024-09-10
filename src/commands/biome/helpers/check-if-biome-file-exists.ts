import fs from "node:fs";

export function checkIfBiomeFileExists(cwd: string) {
  return fs.existsSync(`${cwd}/biome.json`);
}
