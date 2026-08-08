import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { validatePort } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 27_017,
  repository: "mongo",
};

const fallbackVersions = new Set(["latest", "8.0", "7.0", "6.0"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "mongo",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What MongoDB version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const user = await enhancedText({
    defaultValue: "docker",
    message: "What is the MongoDB root user?",
  });

  const password = await enhancedText({
    defaultValue: "docker",
    message: "What is the MongoDB root password?",
  });

  const port = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the MongoDB port?",
    validate(value) {
      return validatePort(value, imageConfig.defaultPort);
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
        MONGO_INITDB_ROOT_PASSWORD: password,
        MONGO_INITDB_ROOT_USERNAME: user,
      },
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data/db`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: ["CMD-SHELL", `mongosh --eval "db.adminCommand('ping')" --quiet`],
        timeout: "5s",
      },
    },
    connectionConfig: {
      host: "localhost",
      password,
      port,
      type: "mongodb" as const,
      user,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
