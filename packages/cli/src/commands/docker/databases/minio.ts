import { enhancedConfirm, enhancedSelect, enhancedText } from "~/utils/prompts";

import type { CreateComposeServiceResult, DatabaseImageConfig } from ".";
import { validatePort } from "../schemas/port";

const imageConfig: DatabaseImageConfig = {
  defaultPort: 9000,
  namespace: "minio",
  repository: "minio",
};

const fallbackVersions = new Set([
  "latest",
  "RELEASE.2024-12-18T13-15-44Z",
  "RELEASE.2024-11-07T00-52-20Z",
] as const);

async function createComposeService(): Promise<CreateComposeServiceResult> {
  const serviceName = await enhancedText({
    defaultValue: "minio",
    message: "What is the service name?",
  });

  const version = await enhancedSelect({
    initialValue: "latest",
    message: "What MinIO version would you like to use?",
    options: [...fallbackVersions].map((value) => ({
      label: value,
      value,
    })),
  });

  const rootUser = await enhancedText({
    defaultValue: "minioadmin",
    message: "What is the MinIO root user?",
  });

  const rootPassword = await enhancedText({
    defaultValue: "minioadmin",
    message: "What is the MinIO root password?",
  });

  const apiPort = await enhancedText({
    defaultValue: String(imageConfig.defaultPort),
    message: "What is the API port?",
    validate(value) {
      return validatePort(value, imageConfig.defaultPort);
    },
  });

  const consolePort = await enhancedText({
    defaultValue: "9001",
    message: "What is the Console port?",
    validate(value) {
      return validatePort(value, 9001);
    },
  });

  const useVolume = await enhancedConfirm({
    initialValue: true,
    message: "Do you want to persist data with a volume?",
  });

  return {
    config: {
      image: `${imageConfig.namespace}/${imageConfig.repository}:${version}`,
      command: ["server", "/data", "--console-address", ":9001"],
      environment: {
        MINIO_ROOT_PASSWORD: rootPassword,
        MINIO_ROOT_USER: rootUser,
      },
      ports: [`${apiPort}:9000`, `${consolePort}:9001`],
      ...(useVolume && {
        volumes: [`${serviceName}_data:/data`],
      }),
      healthcheck: {
        interval: "10s",
        retries: 5,
        test: ["CMD-SHELL", "mc ready local || exit 1"],
        timeout: "5s",
      },
    },
    connectionConfig: {
      host: "localhost",
      password: rootPassword,
      port: apiPort,
      type: "minio" as const,
      user: rootUser,
    },
    name: serviceName,
  };
}

export const config = {
  createComposeService,
  imageConfig,
};
