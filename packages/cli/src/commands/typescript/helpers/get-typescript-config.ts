import { enhancedConfirm, enhancedMultiselect } from "~/utils/prompts";

export async function getTypeScriptConfig() {
  const strictness = await enhancedConfirm({
    initialValue: true,
    message: "Do you want strictness?",
  });

  const usingTsc = await enhancedConfirm({
    initialValue: false,
    message: "Are you transpiling with TypeScript (tsc)?",
  });

  const runsInTheDOM = await enhancedConfirm({
    initialValue: false,
    message: "Does your code run in the DOM?",
  });

  const isLibrary = await enhancedConfirm({
    initialValue: false,
    message: "Are you building a library?",
  });

  let isInMonorepo = false;

  if (isLibrary) {
    isInMonorepo = await enhancedConfirm({
      initialValue: false,
      message: "Is this project in a monorepo?",
    });
  }
  const depsToInstall = await enhancedMultiselect({
    initialValues: ["typescript"],
    message: "Which dependencies would you like to install?",
    options: [
      { label: "TypeScript", value: "typescript" },
      { label: "Node (@types/node)", value: "@types/node" },
      { label: "Bun (@types/bun)", value: "@types/bun" },
      {
        label: "Cloudflare Workers (@cloudflare/workers-types)",
        value: "@cloudflare/workers-types",
      },
    ],
  });

  return {
    depsToInstall,
    isInMonorepo,
    isLibrary,
    runsInTheDOM,
    strictness,
    usingTsc,
  };
}

export type TypeScriptConfig = Awaited<ReturnType<typeof getTypeScriptConfig>>;
