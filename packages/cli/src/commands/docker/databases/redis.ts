import { safeParse } from "valibot";
import { formatValibotErrors } from "~/utils/format-valibot-errors";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import type { ComposeService, DatabaseImageConfig } from ".";
import { portSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  namespace: "bitnami",
  repository: "redis",
  defaultPort: 6379,
};

const fallbackVersions = new Set(["latest", "7.4", "7.2", "6.2"] as const);

async function createComposeService(): Promise<ComposeService> {
  const version = await enhancedSelect({
    message: "What Redis version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const password = await enhancedText({
    message: "What is the Redis password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the Redis database?",
    defaultValue: "redis",
  });

  const port = await enhancedText({
    message: "What is the Redis port?",
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
      REDIS_MASTER_PASSWORD: password,
      REDIS_DATABASE: db,
    },
    ports: [`${port}:${imageConfig.defaultPort}`],
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
