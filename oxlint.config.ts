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

    // Deferred: 3 errors
    complexity: "off",
    // Deferred: 5 errors
    "no-warning-comments": "off",
    // Deferred: 4 errors
    "no-await-in-loop": "off",
    // Deferred: 118 errors
    "no-use-before-define": "off",
    // Deferred: 3 errors
    "typescript/no-dynamic-delete": "off",
    // Deferred: 6 errors
    "prefer-destructuring": "off",
    // Deferred: 6 errors
    "require-unicode-regexp": "off",
    // Deferred: 9 errors
    "no-shadow": "off",
    // Deferred: 6 errors
    "prefer-named-capture-group": "off",
    // Deferred: 30 errors
    "unicorn/no-await-expression-member": "off",
    // Deferred: 20 errors
    "require-await": "off",
    // Deferred: 1 error
    "oxc/branches-sharing-code": "off",
    // Deferred: 24 errors
    "typescript/no-unnecessary-type-conversion": "off",
    // Deferred: 12 errors
    "typescript/strict-boolean-expressions": "off",
    // Deferred: 7 errors
    "typescript/no-unsafe-type-assertion": "off",
    // Deferred: 3 errors
    "typescript/no-deprecated": "off",
    // Deferred: 13 errors
    "typescript/consistent-return": "off",
    // Deferred: 2 errors
    "typescript/no-unsafe-assignment": "off",
    // Deferred: 3 errors
    "typescript/no-unsafe-member-access": "off",
    // Deferred: 2 errors
    "typescript/switch-exhaustiveness-check": "off",
    // Deferred: 3 errors
    "typescript/prefer-nullish-coalescing": "off",
    // Deferred: 11 errors
    "typescript/method-signature-style": "off",
    // Deferred: 5 errors
    "unicorn/import-style": "off",
    // Deferred: 2 errors
    "promise/prefer-await-to-callbacks": "off",
    // Deferred: 3 errors
    "unicorn/no-array-reduce": "off",
    "unicorn/no-object-as-default-parameter": "error",
    // Deferred: 1 error
    "max-classes-per-file": "off",
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
