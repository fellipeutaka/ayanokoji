import type { TypeScriptConfig } from "./get-typescript-config";

export const baseOptions = {
  esModuleInterop: true,
  skipLibCheck: true,
  target: "es2022",
  verbatimModuleSyntax: true,
  allowJs: true,
  resolveJsonModule: true,
  moduleDetection: "force",
};

export const strictnessOptions = {
  strict: true,
  noUncheckedIndexedAccess: true,
};

export const tscOptions = {
  moduleResolution: "NodeNext",
  module: "NodeNext",
  outDir: "dist",
  sourceMap: true,
};

export const nonTscOptions = {
  moduleResolution: "Bundler",
  module: "ESNext",
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
