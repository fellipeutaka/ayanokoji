import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
// import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [
    core,
    react,
    next,
    // Deferred: 77 errors
    // vitest,
  ],
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

    complexity: "error",
    "no-warning-comments": "error",
    "no-await-in-loop": "error",
    // Deferred: 118 errors
    "no-use-before-define": "off",
    "typescript/no-dynamic-delete": "error",
    "prefer-destructuring": "error",
    "require-unicode-regexp": "error",
    "no-shadow": "error",
    "prefer-named-capture-group": "error",
    "unicorn/no-await-expression-member": "error",
    "require-await": "error",
    "oxc/branches-sharing-code": "error",
    "typescript/no-unnecessary-type-conversion": "error",
    "typescript/strict-boolean-expressions": "error",
    "typescript/no-unsafe-type-assertion": "error",
    "typescript/no-deprecated": "error",
    "typescript/consistent-return": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/prefer-nullish-coalescing": "error",
    "typescript/method-signature-style": ["error", "property"],
    "unicorn/import-style": "error",
    "promise/prefer-await-to-callbacks": "error",
    "unicorn/no-array-reduce": "error",
    "unicorn/no-object-as-default-parameter": "error",
    "max-classes-per-file": "error",
    // Deferred: 2 errors
    "typescript/parameter-properties": "off",
    // Deferred: 4 errors
    "class-methods-use-this": "off",
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
