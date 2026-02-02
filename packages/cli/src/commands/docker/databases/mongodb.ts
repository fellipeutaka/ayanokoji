import { formatZodErrors } from "~/utils/format-zod-errors";
import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";
import { getPortSchema } from "../schemas/port";
import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";

const imageConfig: DatabaseImageConfig = {
  repository: "mongo",
  defaultPort: 27_017,
};

const fallbackVersions = new Set(["latest", "8.0", "7.0", "6.0"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    message: "What is the service name?",
    defaultValue: "mongo",
  });

  const version = await enhancedSelect({
    message: "What MongoDB version would you like to use?",
    options: Array.from(fallbackVersions).map((value) => ({
      value,
      label: value,
    })),
    initialValue: "latest",
  });

  const user = await enhancedText({
    message: "What is the MongoDB root user?",
    defaultValue: "docker",
  });

  const password = await enhancedText({
    message: "What is the MongoDB root password?",
    defaultValue: "docker",
  });

  const port = await enhancedText({
    message: "What is the MongoDB port?",
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
        MONGO_INITDB_ROOT_USERNAME: user,
        MONGO_INITDB_ROOT_PASSWORD: password,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data/db`],
      }),
      healthcheck: {
        test: ["CMD-SHELL", `mongosh --eval "db.adminCommand('ping')" --quiet`],
        interval: "10s",
        timeout: "5s",
        retries: 5,
      },
    },
    connectionConfig: {
      type: "mongodb" as const,
      user,
      password,
      host: "localhost",
      port,
    },
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
