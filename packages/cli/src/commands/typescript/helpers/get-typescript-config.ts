import { enhancedConfirm, enhancedMultiselect } from "~/utils/prompts";

export async function getTypeScriptConfig() {
  const strictness = await enhancedConfirm({
    message: "Do you want strictness?",
    initialValue: true,
  });

  const usingTsc = await enhancedConfirm({
    message: "Are you transpiling with TypeScript (tsc)?",
    initialValue: false,
  });

  const runsInTheDOM = await enhancedConfirm({
    message: "Does your code run in the DOM?",
    initialValue: false,
  });

  const isLibrary = await enhancedConfirm({
    message: "Are you building a library?",
    initialValue: false,
  });

  let isInMonorepo = false;

  if (isLibrary) {
    isInMonorepo = await enhancedConfirm({
      message: "Is this project in a monorepo?",
      initialValue: false,
    });
  }
  const depsToInstall = await enhancedMultiselect({
    message: "Which dependencies would you like to install?",
    options: [
      { value: "typescript", label: "TypeScript" },
      { value: "@types/node", label: "Node (@types/node)" },
      { value: "@types/bun", label: "Bun (@types/bun)" },
      {
        value: "@cloudflare/workers-types",
        label: "Cloudflare Workers (@cloudflare/workers-types)",
      },
    ],
    initialValues: ["typescript"],
  });

  return {
    strictness,
    usingTsc,
    runsInTheDOM,
    isLibrary,
    isInMonorepo,
    depsToInstall,
  };
}

export type TypeScriptConfig = Awaited<ReturnType<typeof getTypeScriptConfig>>;
