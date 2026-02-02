import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  repository: "postgres",
  defaultPort: 5432,
};

const fallbackVersions = new Set(["latest", "17", "16", "15", "14"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "postgres",
  });

  const version = await enhancedSelect({
    message: "What Postgres version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the Postgres user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the Postgres password?",
    defaultValue: "docker",
  });

  const db = await enhancedText({
    message: "What is the Postgres database?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the Postgres port?",
    defaultValue: String(imageConfig.defaultPort),
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const useVolume = await enhancedConfirm({
    message: "Do you want to persist data with a volume?",
    initialValue: true,
  });

  return {
    name: serviceName,
    config: {
      image: `${imageConfig.repository}:${version}`,
      environment: {
        POSTGRES_USER: user,
        POSTGRES_PASSWORD: password,
        POSTGRES_DB: db,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/postgresql/data`],
      }),
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
