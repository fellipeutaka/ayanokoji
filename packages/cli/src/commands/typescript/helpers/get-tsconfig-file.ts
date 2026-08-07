import type { TypeScriptConfig } from "./get-typescript-config";

export const baseOptions = {
  allowJs: true,
  erasableSyntaxOnly: true,
  esModuleInterop: true,
  moduleDetection: "force",
  resolveJsonModule: true,
  skipLibCheck: true,
  target: "es2022",
  verbatimModuleSyntax: true,
};

export const strictnessOptions = {
  noImplicitOverride: true,
  noUncheckedIndexedAccess: true,
  strict: true,
};

export const tscOptions = {
  module: "NodeNext",
  moduleResolution: "NodeNext",
  outDir: "dist",
  sourceMap: true,
};

export const nonTscOptions = {
  module: "Preserve",
  moduleResolution: "Bundler",
  noEmit: true,
};

export const runsInTheDOMOptions = {
  lib: ["es2022", "dom", "dom.iterable"],
};

export const doesNotRunsInTheDOMOptions = {
  lib: ["es2022"],
};

export const libraryOptions = {
  declaration: true,
};

export const libraryMonorepoOptions = {
  composite: true,
  declarationMap: true,
};

export function getTsconfigFile(config: TypeScriptConfig) {
  return {
    compilerOptions: {
      ...baseOptions,
      ...(config.strictness ? strictnessOptions : {}),
      ...(config.usingTsc ? tscOptions : nonTscOptions),
      ...(config.runsInTheDOM
        ? runsInTheDOMOptions
        : doesNotRunsInTheDOMOptions),
      ...(config.isLibrary ? libraryOptions : {}),
      ...(config.isInMonorepo ? libraryMonorepoOptions : {}),
    },
  };
}

export type TSConfigFile = ReturnType<typeof getTsconfigFile>;
