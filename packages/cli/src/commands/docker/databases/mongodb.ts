import { safeParse } from "valibot";
import { formatValibotErrors } from "~/utils/format-valibot-errors";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import type { ComposeService, DatabaseImageConfig } from ".";
import { portSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  namespace: "bitnami",
  repository: "mongodb",
  defaultPort: 5432,
};

const fallbackVersions = new Set(["latest", "7.0", "6.0", "5.0"] as const);

async function createComposeService(): Promise<ComposeService> {
  const version = await enhancedSelect({
    message: "What MongoDB version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the MongoDB user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the MongoDB password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the MongoDB database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MongoDB port?",
    defaultValue: String(imageConfig.defaultPort),
    validate(value) {
      const result = safeParse(portSchema, value);

      if (result.issues) {
        return formatValibotErrors(result.issues);
      }
    },
  });

  return {
    image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
    environment: {
      MONGODB_ROOT_USER: user,
      MONGODB_ROOT_PASSWORD: password,
      MONGODB_DATABASE: db,
    },
    ports: [`${port}:${imageConfig.defaultPort}`],
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
