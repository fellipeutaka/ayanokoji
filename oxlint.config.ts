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
    // TODO: Enable it later and fix all the issues
    // 77 errors
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

    // TODO: Enable it later and fix all the issues
    // 3 errors
    complexity: "off",
    // 5 errors
    "no-warning-comments": "off",
    // 4 errors
    "no-await-in-loop": "off",
    // 118 errors
    "no-use-before-define": "off",
    // 3 errors
    "typescript/no-dynamic-delete": "off",
    // 6 errors
    "prefer-destructuring": "off",
    // 6 errors
    "require-unicode-regexp": "off",
    // 9 errors
    "no-shadow": "off",
    // 6 errors
    "prefer-named-capture-group": "off",
    // 30 errors
    "unicorn/no-await-expression-member": "off",
    // 20 errors
    "require-await": "off",
    // 1 errors
    "oxc/branches-sharing-code": "off",
    // 24 errors
    "typescript/no-unnecessary-type-conversion": "off",
    // 12 errors
    "typescript/strict-boolean-expressions": "off",
    // 7 errors
    "typescript/no-unsafe-type-assertion": "off",
    // 3 errors
    "typescript/no-deprecated": "off",
    // 13 errors
    "typescript/consistent-return": "off",
    // 2 errors
    "typescript/no-unsafe-assignment": "off",
    // 3 errors
    "typescript/no-unsafe-member-access": "off",
    // 2 errors
    "typescript/switch-exhaustiveness-check": "off",
    // 3 errors
    "typescript/prefer-nullish-coalescing": "off",
    // 11 errors
    "typescript/method-signature-style": "off",
    // 5 errors
    "unicorn/import-style": "off",
    // 2 errors
    "promise/prefer-await-to-callbacks": "off",
    // 3 errors
    "unicorn/no-array-reduce": "off",
    // 1 errors
    "unicorn/no-object-as-default-parameter": "off",
    // 1 errors
    "max-classes-per-file": "off",
    // 2 errors
    "typescript/parameter-properties": "off",
    // 4 errors
    "class-methods-use-this": "off",
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
