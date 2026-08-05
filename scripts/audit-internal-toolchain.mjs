import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const TOOL_REFERENCE_PATTERN =
  /\b(?:bun|biome|ultracite)\b|@biomejs\/biome|bun:/giu;
const BINARY_FILE_PATTERN =
  /\.(?:gif|ico|jpeg|jpg|png|svg|webp|woff2?|eot|ttf|mp[34]|zip|tgz)$/iu;

const intentionalReferenceCategories = [
  {
    label: "public CLI behavior",
    matches: (filePath) =>
      filePath.startsWith("packages/cli/src/") &&
      !filePath.includes(".test.") &&
      !filePath.includes(".spec."),
  },
  {
    label: "public documentation",
    matches: (filePath) =>
      filePath.startsWith("apps/docs/src/content/docs/") ||
      [
        "apps/docs/src/components/ui/icons.tsx",
        "apps/docs/src/config/site.ts",
      ].includes(filePath),
  },
  {
    label: "historical or domain documentation",
    matches: (filePath) =>
      filePath.startsWith("docs/") ||
      ["CONTEXT.md", "packages/cli/CHANGELOG.md"].includes(filePath),
  },
  {
    label: "contributor documentation",
    matches: (filePath) => ["AGENTS.md", "README.md"].includes(filePath),
  },
  {
    label: "legacy-tool rejection guardrails",
    matches: (filePath) =>
      [
        ".claude/hooks/enforce-pkg-manager.sh",
        ".opencode/plugins/guardrails.js",
      ].includes(filePath),
  },
  {
    label: "audit policy",
    matches: (filePath) =>
      [
        "scripts/audit-internal-toolchain.mjs",
        "scripts/verify-cli-boundary.mjs",
      ].includes(filePath),
  },
];

function getReferenceCategory(filePath) {
  return (
    intentionalReferenceCategories.find((category) =>
      category.matches(filePath)
    )?.label ?? null
  );
}

function getTrackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: ROOT_DIRECTORY,
    encoding: "utf8",
  })
    .split("\0")
    .filter((filePath) => filePath.length > 0);
}

function getLineNumber(contents, index) {
  return contents.slice(0, index).split("\n").length;
}

const intentionalReferences = new Map();
const violations = [];

for (const filePath of getTrackedFiles()) {
  if (BINARY_FILE_PATTERN.test(filePath)) {
    continue;
  }

  if (lstatSync(join(ROOT_DIRECTORY, filePath)).isSymbolicLink()) {
    continue;
  }

  const contents = readFileSync(join(ROOT_DIRECTORY, filePath), "utf8");
  const category = getReferenceCategory(filePath);

  for (const match of contents.matchAll(TOOL_REFERENCE_PATTERN)) {
    const reference = {
      filePath,
      line: getLineNumber(contents, match.index ?? 0),
      value: match[0],
    };

    if (category === null) {
      violations.push(reference);
      continue;
    }

    const references = intentionalReferences.get(category) ?? [];
    references.push(reference);
    intentionalReferences.set(category, references);
  }
}

if (violations.length > 0) {
  console.error("Unexpected internal toolchain references found:");
  for (const violation of violations) {
    console.error(
      `- ${violation.filePath}:${violation.line} contains ${violation.value}`
    );
  }
  process.exitCode = 1;
} else {
  console.log("Internal toolchain audit passed.");
}

if (intentionalReferences.size > 0) {
  console.log("Intentional legacy-tool references:");
  for (const [category, references] of intentionalReferences) {
    const locations = references.map(
      (reference) => `${reference.filePath}:${reference.line}`
    );
    console.log(`- ${category}: ${[...new Set(locations)].join(", ")}`);
  }
}
