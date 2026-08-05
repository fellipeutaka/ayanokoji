import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const CLI_DIRECTORY = join(ROOT_DIRECTORY, "packages/cli");
const CLI_MANIFEST_PATH = join(CLI_DIRECTORY, "package.json");
const CLI_MANIFEST = JSON.parse(readFileSync(CLI_MANIFEST_PATH, "utf8"));
const DEVELOPMENT_ONLY_PACKAGES = new Set([
  "@biomejs/biome",
  "@typescript/native",
  "oxfmt",
  "oxlint",
  "oxlint-tsgolint",
  "tsdown",
  "typescript",
  "ultracite",
  "vitest",
]);
const EXPECTED_RUNTIME_DEPENDENCIES = [
  "@antfu/ni",
  "@clack/prompts",
  "commander",
  "nano-spawn",
  "picocolors",
  "yaml",
  "zod",
];
const PUBLIC_COMMANDS = [
  "biome",
  "docker",
  "drizzle",
  "gitignore",
  "prisma",
  "secret",
  "typescript",
];
const PUBLIC_MARKERS = [
  {
    filePath: "src/commands/biome/index.ts",
    markers: ['new Command("biome")'],
  },
  {
    filePath: "src/commands/drizzle/databases/sqlite.ts",
    markers: ['value: "bun-sqlite"', 'from "bun:sqlite"'],
  },
  {
    filePath: "src/utils/get-package-manager.ts",
    markers: ['"bun"'],
  },
  {
    filePath: "src/commands/typescript/helpers/get-tsconfig-file.ts",
    markers: ['target: "es2022"', 'moduleResolution: "Bundler"'],
  },
  {
    filePath: "src/commands/drizzle/helpers/create-drizzle-scripts.ts",
    markers: ["  bun: {", '"db:generate": "bun run drizzle generate"'],
  },
];
const BUNDLE_REFERENCE_PATTERN =
  /\b(?:oxfmt|oxlint|tsdown|ultracite|vitest)\b|@typescript\/native|oxlint-tsgolint/giu;
const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function getSortedKeys(value) {
  return Object.keys(value ?? {}).sort();
}

function getJsonValue(value) {
  return JSON.stringify(value);
}

function readCliFile(filePath) {
  return readFileSync(join(CLI_DIRECTORY, filePath), "utf8");
}

function parsePackResult(output) {
  const jsonStart = output.indexOf("{");
  return JSON.parse(output.slice(jsonStart));
}

assert(
  CLI_MANIFEST.private === false,
  "The CLI package must remain publishable."
);
assert(
  CLI_MANIFEST.main === "./dist/index.mjs",
  "The CLI main entry point changed."
);
assert(
  CLI_MANIFEST.exports === "./dist/index.mjs",
  "The CLI exports entry point changed."
);
assert(
  CLI_MANIFEST.module === "./dist/index.mjs",
  "The CLI module entry point changed."
);
assert(
  CLI_MANIFEST.bin === "./dist/index.mjs",
  "The CLI binary entry point changed."
);
assert(
  getJsonValue(CLI_MANIFEST.files) === getJsonValue(["dist"]),
  "The CLI published file boundary changed."
);
assert(
  CLI_MANIFEST.sideEffects === false,
  "The CLI sideEffects contract changed."
);

const runtimeDependencies = getSortedKeys(CLI_MANIFEST.dependencies);
const expectedRuntimeDependencies = [...EXPECTED_RUNTIME_DEPENDENCIES].sort();
assert(
  getJsonValue(runtimeDependencies) ===
    getJsonValue(expectedRuntimeDependencies),
  `The CLI runtime dependencies changed: ${runtimeDependencies.join(", ")}`
);

for (const dependency of runtimeDependencies) {
  assert(
    !DEVELOPMENT_ONLY_PACKAGES.has(dependency),
    `Development-only package ${dependency} entered CLI runtime dependencies.`
  );
}

for (const { filePath, markers } of PUBLIC_MARKERS) {
  const contents = readCliFile(filePath);
  for (const marker of markers) {
    assert(
      contents.includes(marker),
      `Public CLI marker ${JSON.stringify(marker)} is missing from ${filePath}.`
    );
  }
}

const cliEntryPoint = join(CLI_DIRECTORY, CLI_MANIFEST.main);
try {
  const help = execFileSync(process.execPath, [cliEntryPoint, "--help"], {
    cwd: ROOT_DIRECTORY,
    encoding: "utf8",
  });
  for (const command of PUBLIC_COMMANDS) {
    assert(
      help.includes(`\n  ${command}`),
      `Public CLI command ${command} is missing from the built command list.`
    );
  }
} catch (error) {
  failures.push(
    `The built CLI could not be invoked: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
}

const distFiles = [];
try {
  const packResult = parsePackResult(
    execFileSync(
      "pnpm",
      ["--filter", "ayanokoji", "pack", "--dry-run", "--json"],
      {
        cwd: ROOT_DIRECTORY,
        encoding: "utf8",
      }
    )
  );
  const publishedFiles = packResult.files.map(({ path }) => path);
  const unexpectedFiles = publishedFiles.filter(
    (filePath) =>
      !filePath.startsWith("dist/") &&
      !["LICENSE.md", "package.json"].includes(filePath)
  );
  assert(
    unexpectedFiles.length === 0,
    `Unexpected files would be packed: ${unexpectedFiles.join(", ")}`
  );
  assert(
    publishedFiles.includes("dist/index.mjs"),
    "The built CLI entry point is absent from the package."
  );
  distFiles.push(
    ...publishedFiles
      .filter((filePath) => filePath.startsWith("dist/"))
      .map((filePath) => join(CLI_DIRECTORY, filePath))
  );
} catch (error) {
  failures.push(
    `The CLI package could not be inspected: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
}

for (const filePath of distFiles) {
  const contents = readFileSync(filePath, "utf8");
  for (const match of contents.matchAll(BUNDLE_REFERENCE_PATTERN)) {
    failures.push(
      `Development-only bundle reference ${match[0]} found in ${filePath}.`
    );
  }
}

if (failures.length > 0) {
  console.error("CLI public-boundary verification failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `CLI public-boundary verification passed (${distFiles.length} packed bundle files).`
  );
}
