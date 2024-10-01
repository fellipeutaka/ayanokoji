import { safeParse } from "valibot";
import { formatValibotErrors } from "~/utils/format-valibot-errors";
import { enhancedSelect, enhancedText } from "~/utils/prompts";
import type { ComposeService, DatabaseImageConfig } from ".";
import { portSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  namespace: "bitnami",
  repository: "mysql",
  defaultPort: 3306,
};

const fallbackVersions = new Set([
  "latest",
  "9.0.1",
  "9.0",
  "8.4.2",
  "8.4",
  "8.0",
] as const);

async function createComposeService(): Promise<ComposeService> {
  const version = await enhancedSelect({
    message: "What MySQL version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the MySQL user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the MySQL password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the MySQL database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MySQL port?",
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
      MYSQL_ROOT_USER: user,
      MYSQL_ROOT_PASSWORD: password,
      MYSQL_DATABASE: db,
    },
    ports: [`${port}:${imageConfig.defaultPort}`],
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
