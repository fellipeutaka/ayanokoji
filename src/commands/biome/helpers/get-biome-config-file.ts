import type { BiomeConfig } from "./get-biome-config";

export function getBiomeConfigFile(config: BiomeConfig) {
  return {
    $schema: "node_modules/@biomejs/biome/configuration_schema.json",
    ...(config.organizeImports && {
      organizeImports: {
        enabled: true,
      },
    }),
    vcs: {
      enabled: true,
      clientKind: "git",
    },
    ...(config.formatter && {
      javascript: {
        formatter: {
          trailingCommas: "es5",
        },
      },
      formatter: {
        enabled: true,
        indentStyle: config.indentStyle,
      },
    }),
    ...(config.linter && {
      linter: {
        enabled: true,
      },
    }),
  };
}

export type BiomeConfigFile = ReturnType<typeof getBiomeConfigFile>;
