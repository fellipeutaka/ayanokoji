import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { getPortSchema } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 5432,
  repository: "postgres",
};

const fallbackVersions = new Set(["latest", "17", "16", "15", "14"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "postgres",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What Postgres version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const user = await enhancedText({
    defaultValue: "docker",
    message: "What is the Postgres user?",
  });

  const password = await enhancedText({
    defaultValue: "docker",
    message: "What is the Postgres password?",
  });

  const db = await enhancedText({
    defaultValue: "docker",
    message: "What is the Postgres database?",
  });

  const port = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the Postgres port?",
    validate(value) {
      const result = getPortSchema(imageConfig.defaultPort).safeParse(value);

      if (!result.success) {
        return formatZodErrors(result.error);
      }
    },
  });

  const useVolume = await enhancedConfirm({
    initialValue: true,
    message: "Do you want to persist data with a volume?",
  });

  return {
    config: {
      image: `${imageConfig.repository}:${version}`,
      environment: {
        POSTGRES_DB: db,
        POSTGRES_PASSWORD: password,
        POSTGRES_USER: user,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/var/lib/postgresql/data`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: ["CMD-SHELL", `pg_isready -U ${user} -d ${db}`],
        timeout: "5s",
      },
    },
    connectionConfig: {
      database: db,
      host: "localhost",
      password,
      port,
      type: "postgresql" as const,
      user,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
