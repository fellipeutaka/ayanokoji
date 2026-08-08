const PREFERRED_PACKAGE_MANAGER = "pnpm";

const WRONG_PACKAGE_MANAGERS = {
  bun: PREFERRED_PACKAGE_MANAGER,
  bunx: "pnpm dlx",
  deno: PREFERRED_PACKAGE_MANAGER,
  npm: PREFERRED_PACKAGE_MANAGER,
  npx: "pnpm dlx",
  pnpx: "pnpm dlx",
  vlt: PREFERRED_PACKAGE_MANAGER,
  yarn: PREFERRED_PACKAGE_MANAGER,
};

const DANGEROUS_GIT = [
  {
    pattern: /git push.*(--force|-f\b|--force-with-lease)/,
    reason: "force push rewrites remote history",
  },
  {
    pattern: /git reset --hard/,
    reason: "irreversibly discards local commits",
  },
  {
    pattern: /git clean.*-[a-zA-Z]*f/,
    reason: "permanently deletes untracked files",
  },
  {
    pattern: /git branch -D/,
    reason: "force-deletes a branch without a merge check",
  },
  {
    pattern: /git (checkout|restore) (--\s*)?(\.|\.\/|\*)/,
    reason: "discards uncommitted working-tree changes",
  },
  {
    pattern: /git (filter-branch|filter-repo)/,
    reason: "rewrites repository history",
  },
];

const READ_COMMANDS =
  /\b(cat|bat|head|tail|less|more|grep|rg|find|sed|awk|git\s+(show|diff))\b/;
const NODE_MODULES = /\bnode_modules\//;
const NODE_MODULE_PACKAGE = /node_modules\/(?:@[^/]+\/)?[^/]+/;
const SENSITIVE_PATH = /(^|[\\/])\.env(?:$|\.)|\.pem$|credentials/i;
const SENSITIVE_COMMAND = /(^|[\s/])\.env(?:$|\.)|\.pem([\s]|$)|credentials/i;

function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesBinary(command, binary) {
  return new RegExp(
    `(^|;|&&|\\|\\||\\|)\\s*${escapeRegExp(binary)}(\\s|$)`
  ).test(command);
}

function isSensitivePath(value) {
  return SENSITIVE_PATH.test(value);
}

function opensrcHint(packageName) {
  return `Use opensrc to fetch original dependency source instead.\nopensrc path ${packageName || "<package>"}`;
}

export const Guardrails = async () => ({
  "tool.execute.before": (input, output) => {
    const args = output.args ?? {};

    if (["read", "edit", "write"].includes(input.tool)) {
      const path = String(args.filePath ?? args.path ?? "");

      if (isSensitivePath(path)) {
        throw new Error(`BLOCKED: protected sensitive path '${path}'.`);
      }

      if (input.tool === "read" && NODE_MODULES.test(path)) {
        const match = path.match(NODE_MODULE_PACKAGE);
        throw new Error(
          `BLOCKED: do not read '${path}' directly.\n${opensrcHint(match?.[0] ?? "<package>")}`
        );
      }
    }

    if (input.tool !== "bash") {
      return;
    }

    const command = String(args.command ?? "");

    for (const [binary, preferred] of Object.entries(WRONG_PACKAGE_MANAGERS)) {
      if (matchesBinary(command, binary)) {
        throw new Error(`BLOCKED: use '${preferred}' instead of '${binary}'.`);
      }
    }

    for (const { pattern, reason } of DANGEROUS_GIT) {
      if (pattern.test(command)) {
        throw new Error(
          `BLOCKED: '${command}' — ${reason}. Ask the user for confirmation first.`
        );
      }
    }

    if (NODE_MODULES.test(command) && READ_COMMANDS.test(command)) {
      const match = command.match(NODE_MODULE_PACKAGE);
      throw new Error(
        `BLOCKED: do not read node_modules/ directly.\n${opensrcHint(match?.[0] ?? "<package>")}`
      );
    }

    if (READ_COMMANDS.test(command) && SENSITIVE_COMMAND.test(command)) {
      throw new Error(
        "BLOCKED: do not read environment, key, or credential files through the shell."
      );
    }
  },
});
