import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, react, next, vitest],
  ignorePatterns: [
    ...(core.ignorePatterns ?? []),
    "**/.agents/**",
    "**/.claude/**",
    "**/.opencode/**",
    "**/.turbo/**",
  ],
  rules: {
    "sort-keys": "off",

    "func-style": ["error", "declaration", { allowArrowFunctions: true }],
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "function-declaration",
      },
    ],
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
