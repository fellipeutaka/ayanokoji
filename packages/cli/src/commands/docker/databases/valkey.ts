import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { validatePort } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 6379,
  namespace: "valkey",
  repository: "valkey",
};

const fallbackVersions = new Set(["latest", "8.0", "7.2"] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "valkey",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What Valkey version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const password = await enhancedText({
    defaultValue: "docker",
    message: "What is the Valkey password?",
  });

  const port = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the Valkey port?",
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
      image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
      command: ["valkey-server", "--requirepass", password],
      ports: [`${port}:${imageConfig.defaultPort}`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: ["CMD-SHELL", `valkey-cli -a ${password} ping | grep PONG`],
        timeout: "5s",
      },
    },
    connectionConfig: {
      host: "localhost",
      password,
      port,
      type: "valkey" as const,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
